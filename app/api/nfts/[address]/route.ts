import { NextResponse } from 'next/server'
import { getOpenSeaChain } from '@/lib/opensea-capycamp'
import { getCapyCampNftsForOwner } from '@/lib/capycamp-nfts'

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  const segments = requestUrl.pathname.split('/').filter(Boolean)
  const address = segments[segments.length - 1]

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Missing or invalid wallet address' }, { status: 400 })
  }

  const chain = getOpenSeaChain()
  const requestedLimit = Number(requestUrl.searchParams.get('limit') ?? 200)
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 500)) : 200

  try {
    const nfts = await getCapyCampNftsForOwner(address, { limit })

    const openseaKey = process.env.OPENSEA_API_KEY
    let source = 'rpc'
    if (nfts.length > 0) {
      source = openseaKey ? 'rpc+opensea' : 'rpc'
    } else {
      source = openseaKey ? 'opensea' : 'none'
    }

    const res = NextResponse.json({
      nfts,
      source,
      chain,
      ...(nfts.length === 0
        ? {
            hint: openseaKey
              ? 'No CapyCamp NFTs for this address on Abstract RPC/OpenSea.'
              : 'Add OPENSEA_API_KEY for metadata merge.',
          }
        : {}),
    })
    // Cache on the edge/client to make profile feel instant; refresh in background.
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch NFTs'
    return NextResponse.json({
      nfts: [],
      chain,
      error: message,
      hint: 'RPC + OpenSea failed.',
    })
  }
}
