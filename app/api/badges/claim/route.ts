import { NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { BADGES } from '@/lib/badges'
import { claimBadge, hasClaimedBadge } from '@/app/api/badges/store'
import { getDailyClaim } from '@/app/api/rewards/store'
import { getProfile } from '@/app/api/profile/store'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

function isValidTxHash(h: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(h)
}

const TX_NOTE_PREFIX = 'CapyCamp Badge Claim:'

function buildClaimMessage(slug: string): string {
  // Must match what the client signs.
  return `${TX_NOTE_PREFIX}\nBadge: ${slug}`
}

function computeEarned(address: string, slug: string): boolean {
  const lower = address.toLowerCase()
  const dailyClaim = getDailyClaim(lower)
  const streak = dailyClaim?.streak ?? 0
  const profile = getProfile(lower)

  if (slug === 'first-day-at-camp') {
    return true
  }

  if (slug === 'navigator') {
    const hasFirstBadge = hasClaimedBadge(lower, 'first-day-at-camp')
    const hasXp = typeof profile?.xp === 'number' && profile.xp > 0
    const hasPfp = Boolean(profile?.pfp_token_id) || Boolean(profile?.pfp_image)
    return hasFirstBadge && hasPfp && hasXp
  }

  if (slug === 'daily-login-streak') return streak >= 7

  // Other badges not earnable yet.
  return false
}

function requiredPreviousSlug(slug: string): string | null {
  const idx = BADGES.findIndex((b) => b.slug === slug)
  if (idx <= 0) return null
  return BADGES[idx - 1]?.slug ?? null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const address = typeof body?.address === 'string' ? body.address.trim().toLowerCase() : null
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : null
  const signature = typeof body?.signature === 'string' ? body.signature.trim() : null

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }
  if (!slug || !BADGES.some((b) => b.slug === slug)) {
    return NextResponse.json({ error: 'Missing or invalid badge slug' }, { status: 400 })
  }
  if (!signature || !signature.startsWith('0x')) {
    return NextResponse.json({ error: 'Missing or invalid signature' }, { status: 400 })
  }

  if (hasClaimedBadge(address, slug)) {
    return NextResponse.json({ claimed: true, alreadyClaimed: true })
  }

  const prev = requiredPreviousSlug(slug)
  if (prev && !hasClaimedBadge(address, prev)) {
    return NextResponse.json({ error: `Locked — claim ${prev} first` }, { status: 403 })
  }

  const earned = computeEarned(address, slug)
  if (!earned) {
    return NextResponse.json({ error: 'Not eligible to claim this badge yet' }, { status: 403 })
  }

  // Signature-only claim: no on-chain transaction, so users never pay gas.
  const message = buildClaimMessage(slug)
  let valid = false
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
  } catch {
    valid = false
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  claimBadge(address, slug)
  return NextResponse.json({ claimed: true, slug })
}

