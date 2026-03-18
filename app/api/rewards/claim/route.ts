import { NextResponse } from 'next/server'
import { getProfile } from '../../profile/store'
import {
  addRewardEvent,
  getDailyClaim,
  getNextUtcMidnight,
  getTodayUtcDateString,
  getYesterdayUtcDateString,
  upsertDailyClaim,
} from '../store'

const BASE_XP = 80
const STREAK_XP_PER_DAY = 12
const MAX_STREAK_BONUS_DAYS = 14

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const address = typeof body?.address === 'string' ? body.address.trim() : null

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }

  const today = getTodayUtcDateString()
  const yesterday = getYesterdayUtcDateString()

  const existing = getDailyClaim(address)

  if (existing?.lastClaimDate === today) {
    const nextReset = getNextUtcMidnight()
    const now = new Date()
    const msUntilReset = Math.max(0, nextReset.getTime() - now.getTime())

    return NextResponse.json(
      {
        error: 'Already claimed today',
        hasClaimedToday: true,
        streak: existing.streak,
        nextResetIso: nextReset.toISOString(),
        secondsUntilReset: Math.floor(msUntilReset / 1000),
      },
      { status: 400 },
    )
  }

  let streak = 1

  if (existing) {
    if (existing.lastClaimDate === yesterday) {
      streak = existing.streak + 1
    } else {
      streak = 1
    }
  }

  const updated = {
    address,
    lastClaimDate: today,
    streak,
  }

  upsertDailyClaim(updated)

  const profile = getProfile(address.toLowerCase())
  const xpBoostPercent = profile?.xp_boost_percent ?? 0
  const streakBonusDays = Math.min(streak, MAX_STREAK_BONUS_DAYS)
  const baseXp = BASE_XP + streakBonusDays * STREAK_XP_PER_DAY
  const bonusXp = Math.floor((baseXp * xpBoostPercent) / 100)
  const totalXp = baseXp + bonusXp

  addRewardEvent({
    id: `${address.toLowerCase()}-${today}-${Date.now()}`,
    address,
    claimedAt: new Date().toISOString(),
    rewardType: 'daily',
    streakAfterClaim: streak,
  })

  const nextReset = getNextUtcMidnight()
  const now = new Date()
  const msUntilReset = Math.max(0, nextReset.getTime() - now.getTime())

  return NextResponse.json({
    address,
    hasClaimedToday: true,
    streak,
    nextResetIso: nextReset.toISOString(),
    secondsUntilReset: Math.floor(msUntilReset / 1000),
    baseXp,
    bonusXp,
    totalXp,
    xpBoostPercent,
    camperPerkActive: xpBoostPercent > 0,
  })
}
