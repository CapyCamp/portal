import { NextResponse } from 'next/server'
import { getProfile, patchProfile } from '../store'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

/**
 * Sync profile from client (e.g. localStorage) to server store so badges and settings
 * stay consistent after serverless cold starts.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const wallet = typeof body?.wallet === 'string' ? body.wallet.trim().toLowerCase() : null

  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json({ error: 'Missing or invalid wallet' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { wallet }

  if (typeof body?.display_name === 'string') {
    patch.display_name = body.display_name.trim().slice(0, 48) || undefined
  }
  if (body?.pfp_image !== undefined) {
    patch.pfp_image = body.pfp_image
  }
  if (typeof body?.pfp_rarity === 'string') {
    patch.pfp_rarity = body.pfp_rarity
  }
  if (body?.profile_bg_from != null && typeof body.profile_bg_from === 'string') {
    patch.profile_bg_from = body.profile_bg_from
  }
  if (body?.profile_bg_to != null && typeof body.profile_bg_to === 'string') {
    patch.profile_bg_to = body.profile_bg_to
  }
  if (Array.isArray(body?.claimed_badges)) {
    patch.claimed_badges = body.claimed_badges.filter((s: unknown) => typeof s === 'string')
  }

  patchProfile(wallet, patch as Parameters<typeof patchProfile>[1])
  const profile = getProfile(wallet) || { wallet }
  return NextResponse.json(profile)
}
