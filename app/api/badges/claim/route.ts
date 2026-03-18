import { NextResponse } from 'next/server'
import { createPublicClient, http, toHex } from 'viem'
import { abstract } from 'viem/chains'
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

function publicClient() {
  return createPublicClient({
    chain: abstract,
    transport: http(abstract.rpcUrls.default.http[0]),
  })
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
  const txHash = typeof body?.txHash === 'string' ? body.txHash.trim() : null

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }
  if (!slug || !BADGES.some((b) => b.slug === slug)) {
    return NextResponse.json({ error: 'Missing or invalid badge slug' }, { status: 400 })
  }
  if (!txHash || !isValidTxHash(txHash)) {
    return NextResponse.json({ error: 'Missing or invalid txHash' }, { status: 400 })
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

  // Verify on-chain tx (Abstract): must be from address with matching data prefix.
  // (Some smart wallets route through system contracts, so we do not require tx.to === address.)
  const c = publicClient()
  let receipt: Awaited<ReturnType<typeof c.getTransactionReceipt>> | null = null
  try {
    receipt = await c.getTransactionReceipt({ hash: txHash as `0x${string}` })
  } catch {
    return NextResponse.json({ error: 'Transaction not confirmed yet' }, { status: 409 })
  }
  if (!receipt || receipt.status !== 'success') {
    return NextResponse.json({ error: 'Transaction failed' }, { status: 400 })
  }

  let tx: Awaited<ReturnType<typeof c.getTransaction>> | null = null
  try {
    tx = await c.getTransaction({ hash: txHash as `0x${string}` })
  } catch {
    return NextResponse.json({ error: 'Could not load transaction' }, { status: 400 })
  }
  if (!tx || !tx.from) {
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  }

  const fromOk = tx.from.toLowerCase() === address.toLowerCase()
  const expectedPrefix = toHex(`${TX_NOTE_PREFIX} ${slug}`)
  const dataOk =
    typeof tx.input === 'string' &&
    tx.input.toLowerCase().includes(expectedPrefix.toLowerCase().slice(2)) // ignore 0x and allow AA wrappers

  if (!fromOk || !dataOk) {
    return NextResponse.json({ error: 'Transaction does not match claim requirements' }, { status: 401 })
  }

  claimBadge(address, slug)
  return NextResponse.json({ claimed: true, slug, txHash })
}

