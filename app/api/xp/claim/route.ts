import { NextResponse } from 'next/server'
import { getProfile, patchProfile } from '@/app/api/profile/store'
import { XP_REWARDS, DAILY_CLAIM_COOLDOWN_MS } from '@/config/xp'
import type { RarityTier } from '@/lib/capycamp-rarity'
import { getCapyCampNftsForOwner } from '@/lib/capycamp-nfts'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

/** Daily XP = sum of XP_REWARDS[rarity] for each CapyCamp NFT held (e.g. 20 Rare = 100 XP). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const wallet = typeof body?.wallet === 'string' ? body.wallet.trim().toLowerCase() : null

  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json({ error: 'Missing or invalid wallet' }, { status: 400 })
  }

  const user = getProfile(wallet)
  const now = Date.now()
  const lastClaim = user?.last_claim ?? 0

  let nfts: Awaited<ReturnType<typeof getCapyCampNftsForOwner>> = []
  try {
    nfts = await getCapyCampNftsForOwner(wallet, { limit: 100 })
  } catch {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: user?.xp ?? 0,
      reason: 'failed_to_fetch_holdings',
    })
  }

  const xpPerDay = nfts.reduce(
    (sum, nft) => sum + (XP_REWARDS[nft.rarity as RarityTier] ?? 0),
    0,
  )

  if (nfts.length === 0) {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: user?.xp ?? 0,
      reason: 'no_capycamp_nfts',
      xpPerDay: 0,
    })
  }

  if (lastClaim > 0 && now - lastClaim < DAILY_CLAIM_COOLDOWN_MS) {
    return NextResponse.json({
      claimed: false,
      xpGained: 0,
      totalXp: user?.xp ?? 0,
      nextClaimAt: lastClaim + DAILY_CLAIM_COOLDOWN_MS,
      xpPerDay,
      nftCount: nfts.length,
    })
  }

  const currentXp = user?.xp ?? 0
  const totalXp = currentXp + xpPerDay

  patchProfile(wallet, {
    xp: totalXp,
    last_claim: now,
    last_xp_gained: xpPerDay,
  })

  return NextResponse.json({
    claimed: true,
    xpGained: xpPerDay,
    totalXp,
    lastClaim: now,
    nextClaimAt: now + DAILY_CLAIM_COOLDOWN_MS,
    xpPerDay,
    nftCount: nfts.length,
  })
}
