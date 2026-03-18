import { NextResponse } from 'next/server'
import { getProfile } from '../store'

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
  const profile = getProfile(wallet) || { wallet }

  return NextResponse.json(profile)
}

