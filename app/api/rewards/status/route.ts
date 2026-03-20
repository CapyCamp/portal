import { NextResponse } from 'next/server'
import { getProfile } from '../../profile/store'
import {
  getDailyClaim,
  getNextUtcMidnight,
  getTodayUtcDateString,
} from '../store'
import { XP_REWARDS } from '@/config/xp'
import { getCapyCampNftsForOwner } from '@/lib/capycamp-nfts'
import type { RarityTier } from '@/lib/capycamp-rarity'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }

  const wallet = address.toLowerCase()
  const today = getTodayUtcDateString()
  const record = getDailyClaim(address) || { address, lastClaimDate: '', streak: 0 }
  const profile = getProfile(wallet)

  const clientLastRaw = searchParams.get('clientLastClaim')
  const clientXpRaw = searchParams.get('clientXp')
  const clientLastParsed =
    clientLastRaw != null && clientLastRaw !== '' ? Number(clientLastRaw) : Number.NaN
  const clientXpParsed =
    clientXpRaw != null && clientXpRaw !== '' ? Number(clientXpRaw) : Number.NaN
  const clientLastMs =
    Number.isFinite(clientLastParsed) && clientLastParsed >= 0 ? clientLastParsed : 0
  const clientXpHint =
    Number.isFinite(clientXpParsed) && clientXpParsed >= 0 ? clientXpParsed : 0

  const hasClaimedToday = record.lastClaimDate === today
  const nextReset = getNextUtcMidnight()
  const now = new Date()
  const msUntilReset = Math.max(0, nextReset.getTime() - now.getTime())

  const lastDailyXpClaim = Math.max(profile?.last_claim ?? 0, clientLastMs)
  const DAILY_XP_COOLDOWN_MS = 24 * 60 * 60 * 1000
  const nextDailyXpAt = lastDailyXpClaim > 0 ? lastDailyXpClaim + DAILY_XP_COOLDOWN_MS : 0
  const secondsUntilDailyXp =
    nextDailyXpAt > 0 ? Math.max(0, Math.floor((nextDailyXpAt - now.getTime()) / 1000)) : 0

  let xpPerDay = 0
  let nftCount = 0
  try {
    const nfts = await getCapyCampNftsForOwner(address, { limit: 200 })
    nftCount = nfts.length
    xpPerDay = nfts.reduce(
      (sum, nft) => sum + (XP_REWARDS[nft.rarity as RarityTier] ?? 0),
      0,
    )
  } catch {
    // optional: keep 0
  }

  return NextResponse.json({
    address,
    hasClaimedToday,
    streak: record.streak,
    nextResetIso: nextReset.toISOString(),
    secondsUntilReset: Math.floor(msUntilReset / 1000),
    xpBoostPercent: profile?.xp_boost_percent ?? 0,
    camperPerkActive: (profile?.xp_boost_percent ?? 0) > 0,
    equippedRarity: profile?.pfp_rarity ?? null,
    totalXp: Math.max(profile?.xp ?? 0, clientXpHint),
    lastClaim: lastDailyXpClaim,
    nextDailyXpAt,
    secondsUntilDailyXp,
    xpPerDay,
    nftCount,
    lastXpGained: profile?.last_xp_gained ?? null,
  })
}
