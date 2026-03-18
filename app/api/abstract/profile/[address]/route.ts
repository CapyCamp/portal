import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Work around Next 16 params Promise issue by reading address directly from the URL
  const requestUrl = new URL(req.url)
  const segments = requestUrl.pathname.split('/')
  const address = segments[segments.length - 1]

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  }

  const apiUrl = `https://backend.portal.abs.xyz/api/user/address/${encodeURIComponent(address)}`

  try {
    const res = await fetch(apiUrl, {
      // Cache for 5 minutes at the edge
      next: { revalidate: 300 },
    })

    // If there is simply no Abstract Portal profile for this address yet,
    // return an empty profile instead of treating it as a hard error.
    // No profile, not found, or Portal blocks unauthenticated server requests — still OK for UI
    if (res.status === 404 || res.status === 403 || res.status === 401) {
      return NextResponse.json({ user: null })
    }

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Failed to fetch Abstract profile', status: res.status, message: text.slice(0, 200) },
        { status: res.status >= 500 ? res.status : 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unexpected error fetching Abstract profile', message: error?.message },
      { status: 500 },
    )
  }
}

