/**
 * Shared fetcher for CapyCamp NFTs by owner. Used by the NFT API and profile flows.
 */
import { CAPYCAMP_CONTRACT } from '@/config/capycamp'
import { fetchCapycampersOnChain } from '@/lib/capycamp-onchain'
import {
  fetchCapycampersFromOpenSea,
  getOpenSeaChain,
  type CapyNft,
} from '@/lib/opensea-capycamp'
import { parseAttributesToTraits } from '@/lib/capycamp-rarity'
import { getLocalNftImageSrc, withLocalNftImageSources } from '@/lib/nft-local-image'

function alchemyToCapyNft(nft: {
  tokenId?: string
  name?: string
  image?: { cachedUrl?: string; originalUrl?: string; pngUrl?: string }
  rawMetadata?: { attributes?: { trait_type?: string; value?: unknown }[] }
}): CapyNft {
  const tokenId = String(nft.tokenId ?? '')
  const image = getLocalNftImageSrc(tokenId)
  const name = nft.name ?? `CapyCamp #${tokenId}`
  const raw = nft.rawMetadata as
    | { attributes?: { trait_type?: string; name?: string; value?: unknown }[]; properties?: Record<string, unknown> }
    | undefined
  const p = parseAttributesToTraits(
    raw?.attributes,
    tokenId,
    name,
    image,
    raw?.properties ?? null,
  )
  return {
    tokenId,
    name: p.name,
    image: p.image,
    contract: CAPYCAMP_CONTRACT.toLowerCase(),
    rarity: p.rarity,
    traits: p.traits,
    powerLevel: p.powerLevel,
    xpBoostPercent: p.xpBoostPercent,
    allTraits: p.allTraits,
  }
}

function mergeByTokenId(onchain: CapyNft[], opensea: CapyNft[], limit: number): CapyNft[] {
  const map = new Map<string, CapyNft>()
  for (const n of onchain) map.set(n.tokenId, { ...n })
  for (const n of opensea) {
    const cur = map.get(n.tokenId)
    if (!cur) {
      map.set(n.tokenId, { ...n })
    } else {
      const hasRichTraits =
        cur.traits.hat !== '—' || cur.traits.outfit !== '—' || cur.traits.background !== '—'
      const bestAll =
        (cur.allTraits?.length ?? 0) >= (n.allTraits?.length ?? 0)
          ? cur.allTraits
          : n.allTraits
      map.set(n.tokenId, {
        ...cur,
        image: getLocalNftImageSrc(n.tokenId),
        name: cur.name?.includes('#') ? n.name || cur.name : cur.name || n.name,
        rarity: hasRichTraits ? cur.rarity : n.rarity,
        traits: hasRichTraits ? cur.traits : n.traits,
        powerLevel: hasRichTraits ? cur.powerLevel : n.powerLevel,
        xpBoostPercent: hasRichTraits ? cur.xpBoostPercent : n.xpBoostPercent,
        allTraits: bestAll?.length ? bestAll : cur.allTraits ?? n.allTraits ?? [],
      })
    }
  }
  return Array.from(map.values()).slice(0, limit)
}

async function fetchViaAlchemy(owner: string, apiKey: string, limit: number): Promise<CapyNft[]> {
  const base = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`
  const url = new URL(base)
  url.searchParams.set('owner', owner)
  url.searchParams.append('contractAddresses[]', CAPYCAMP_CONTRACT)
  url.searchParams.set('pageSize', '100')
  const res = await fetch(url.toString(), { next: { revalidate: 120 } })
  if (!res.ok) throw new Error(`Alchemy ${res.status}`)
  const json = await res.json()
  const owned = Array.isArray(json?.ownedNfts) ? json.ownedNfts : []
  return owned.slice(0, limit).map((nft: Parameters<typeof alchemyToCapyNft>[0]) => alchemyToCapyNft(nft))
}

export type GetCapyCampNftsOptions = {
  /** Max NFTs to return (default 20 for display; use higher for large collections) */
  limit?: number
}

/**
 * Fetch CapyCamp NFTs owned by address (on-chain + OpenSea merge, Alchemy fallback).
 * Used for the NFT gallery and ownership checks.
 */
export async function getCapyCampNftsForOwner(
  owner: string,
  options: GetCapyCampNftsOptions = {},
): Promise<CapyNft[]> {
  const limit = options.limit ?? 20
  const openseaKey = process.env.OPENSEA_API_KEY
  const alchemyKey = process.env.ALCHEMY_API_KEY
  const chain = getOpenSeaChain()

  const onchain = await fetchCapycampersOnChain(owner, limit)
  let opensea: CapyNft[] = []
  if (openseaKey) {
    try {
      opensea = await fetchCapycampersFromOpenSea(owner, openseaKey, { limit })
    } catch {
      // optional
    }
  }
  let nfts = mergeByTokenId(onchain, opensea, limit)

  if (nfts.length === 0 && alchemyKey && chain === 'ethereum') {
    nfts = await fetchViaAlchemy(owner, alchemyKey, limit)
  }

  return withLocalNftImageSources(nfts)
}
