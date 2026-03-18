import { NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { getProfile, patchProfile } from '@/app/api/profile/store'
import {
  getDailyClaim,
  getNextUtcMidnight,
  getTodayUtcDateString,
  getYesterdayUtcDateString,
  upsertDailyClaim,
} from '@/app/api/rewards/store'
import { STREAK_DAY_7_BONUS_XP, STREAK_XP_PER_DAY } from '@/config/xp'

const CLAIM_MESSAGE_PREFIX = 'CapyCamp Daily Streak Claim\nDate: '

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const address = typeof body?.address === 'string' ? body.address.trim() : null
  const signature = typeof body?.signature === 'string' ? body.signature : null

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

  if (!signature) {
    return NextResponse.json({ error: 'Signature required (sign in wallet to claim)' }, { status: 400 })
  }

  const message = `${CLAIM_MESSAGE_PREFIX}${today}`
  let valid = false
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
  } catch {
    // invalid signature
  }
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let streak = 1
  if (existing) {
    if (existing.lastClaimDate === yesterday) {
      streak = existing.streak + 1
    } else {
      streak = 1
    }
  }

  const xpGranted = STREAK_XP_PER_DAY + (streak === 7 ? STREAK_DAY_7_BONUS_XP : 0)

  upsertDailyClaim({
    address,
    lastClaimDate: today,
    streak,
  })

  const wallet = address.toLowerCase()
  const profile = getProfile(wallet)
  const currentXp = profile?.xp ?? 0
  const totalXp = currentXp + xpGranted
  patchProfile(wallet, { xp: totalXp })

  const nextReset = getNextUtcMidnight()
  const now = new Date()
  const msUntilReset = Math.max(0, nextReset.getTime() - now.getTime())

  return NextResponse.json({
    success: true,
    hasClaimedToday: true,
    streak,
    xpGranted,
    totalXp,
    day7Bonus: streak === 7,
    nextResetIso: nextReset.toISOString(),
    secondsUntilReset: Math.floor(msUntilReset / 1000),
  })
}
