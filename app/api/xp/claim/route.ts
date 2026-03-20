import { NextResponse } from 'next/server'
import { getProfile, patchProfile } from '@/app/api/profile/store'
import { XP_REWARDS, DAILY_CLAIM_COOLDOWN_MS } from '@/config/xp'
import type { RarityTier } from '@/lib/capycamp-rarity'
import { getCapyCampNftsForOwner } from '@/lib/capycamp-nfts'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

/** Max days of holdings XP granted in one request (catch-up after downtime / missed visits). */
const MAX_CATCH_UP_DAYS = 14

function parseOptionalNonNegNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined
  return value
}

/**
 * Daily holdings XP = sum(XP per rarity) × eligible days since last claim.
 * Merges client localStorage snapshot with the in-memory server store so daily claims still work
 * on Vercel (cold starts wipe the Map).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const wallet = typeof body?.wallet === 'string' ? body.wallet.trim().toLowerCase() : null

  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json({ error: 'Missing or invalid wallet' }, { status: 400 })
  }

  const clientXp = parseOptionalNonNegNumber(body?.clientXp)
  const clientLastClaim = parseOptionalNonNegNumber(body?.clientLastClaim)

  const user = getProfile(wallet)
  const serverXp = user?.xp ?? 0
  const serverLast = user?.last_claim ?? 0

  const baselineXp = Math.max(serverXp, clientXp ?? 0)
  const lastClaimEff = Math.max(serverLast, clientLastClaim ?? 0)

  // Heal server store when client/browser has newer totals (common after serverless cold start).
  if (baselineXp > serverXp || lastClaimEff > serverLast) {
    patchProfile(wallet, {
      xp: baselineXp,
      ...(lastClaimEff > serverLast ? { last_claim: lastClaimEff } : {}),
    })
  }

  const now = Date.now()

  let nfts: Awaited<ReturnType<typeof getCapyCampNftsForOwner>> = []
  try {
    nfts = await getCapyCampNftsForOwner(wallet, { limit: 200 })
  } catch {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: baselineXp,
      lastClaim: lastClaimEff,
      reason: 'failed_to_fetch_holdings',
    })
  }

  const xpPerDay = nfts.reduce(
    (sum, nft) => sum + (XP_REWARDS[nft.rarity as RarityTier] ?? 0),
    0,
  )

  if (nfts.length === 0 || xpPerDay <= 0) {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: baselineXp,
      lastClaim: lastClaimEff,
      reason: 'no_capycamp_nfts',
      xpPerDay: 0,
      nftCount: 0,
    })
  }

  const elapsed = lastClaimEff > 0 ? now - lastClaimEff : Number.POSITIVE_INFINITY
  let grantDays = 0
  if (lastClaimEff <= 0) {
    grantDays = 1
  } else if (elapsed >= DAILY_CLAIM_COOLDOWN_MS) {
    grantDays = Math.min(Math.floor(elapsed / DAILY_CLAIM_COOLDOWN_MS), MAX_CATCH_UP_DAYS)
  }

  if (grantDays <= 0) {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: baselineXp,
      lastClaim: lastClaimEff,
      nextClaimAt: lastClaimEff + DAILY_CLAIM_COOLDOWN_MS,
      xpPerDay,
      nftCount: nfts.length,
    })
  }

  const xpGain = xpPerDay * grantDays
  const totalXp = baselineXp + xpGain

  patchProfile(wallet, {
    xp: totalXp,
    last_claim: now,
    last_xp_gained: xpGain,
  })

  return NextResponse.json({
    claimed: true,
    xpGained: xpGain,
    grantDays,
    totalXp,
    lastClaim: now,
    nextClaimAt: now + DAILY_CLAIM_COOLDOWN_MS,
    xpPerDay,
    nftCount: nfts.length,
  })
}
