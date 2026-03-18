import { NextResponse } from 'next/server'
import { getProfile, patchProfile } from '../store'

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function validHex(s: unknown): s is string {
  return typeof s === 'string' && HEX.test(s.trim())
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const wallet = typeof body?.wallet === 'string' ? body.wallet.toLowerCase() : null
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Missing or invalid wallet' }, { status: 400 })
  }

  const displayName =
    typeof body.displayName === 'string'
      ? body.displayName.trim().slice(0, 48)
      : undefined
  const bgFrom = validHex(body.bgFrom) ? body.bgFrom.trim() : undefined
  const bgTo = validHex(body.bgTo) ? body.bgTo.trim() : undefined

  if (displayName !== undefined) {
    patchProfile(wallet, { display_name: displayName || undefined })
  }
  if (bgFrom !== undefined) {
    patchProfile(wallet, { profile_bg_from: bgFrom })
  }
  if (bgTo !== undefined) {
    patchProfile(wallet, { profile_bg_to: bgTo })
  }

  const profile = getProfile(wallet) || { wallet }
  return NextResponse.json(profile)
}
