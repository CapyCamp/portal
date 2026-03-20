import { NextResponse } from 'next/server'
import { getProfile } from '../../profile/store'
import {
  getDailyClaim,
  getNextUtcMidnight,
  getTodayUtcDateString,
} from '../store'

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

  const hasClaimedToday = record.lastClaimDate === today
  const nextReset = getNextUtcMidnight()
  const now = new Date()
  const msUntilReset = Math.max(0, nextReset.getTime() - now.getTime())

  return NextResponse.json({
    address,
    hasClaimedToday,
    streak: record.streak,
    nextResetIso: nextReset.toISOString(),
    secondsUntilReset: Math.floor(msUntilReset / 1000),
    equippedRarity: profile?.pfp_rarity ?? null,
  })
}
