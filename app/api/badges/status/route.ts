import { NextResponse } from 'next/server'
import { BADGES } from '@/lib/badges'
import { getDailyClaim } from '@/app/api/rewards/store'
import { getProfile } from '@/app/api/profile/store'
import { hasClaimedBadge } from '@/app/api/badges/store'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }

  const lower = address.toLowerCase()

  const dailyClaim = getDailyClaim(lower)
  const streak = dailyClaim?.streak ?? 0
  const profile = getProfile(lower)

  // Basic rules (can be extended later):
  // - daily-login-streak: streak >= 7
  // - others locked for now until NFT + community data is wired up
  const badges = BADGES.map((badge) => {
    let earned = false
    const claimed =
      hasClaimedBadge(lower, badge.slug) ||
      (Array.isArray(profile?.claimed_badges) && profile!.claimed_badges.includes(badge.slug))

    // Badge #1 is intentionally always eligible so users can claim their first badge immediately.
    if (badge.slug === 'first-day-at-camp') {
      earned = true
    }

    // Badge #2: eligible after claiming badge #1.
    if (badge.slug === 'navigator') {
      const hasFirstBadge =
        hasClaimedBadge(lower, 'first-day-at-camp') ||
        (Array.isArray(profile?.claimed_badges) && profile!.claimed_badges.includes('first-day-at-camp'))
      const hasPfp = Boolean(profile?.pfp_token_id) || Boolean(profile?.pfp_image)
      earned = hasFirstBadge && hasPfp
    }

    if (badge.slug === 'daily-login-streak') {
      earned = streak >= 7
    }

    return {
      ...badge,
      earned,
      claimed,
    }
  })

  return NextResponse.json({
    address: lower,
    streak,
    badges,
  })
}

