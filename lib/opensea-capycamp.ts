import { CAPYCAMP_CONTRACT } from '@/config/capycamp'
import { getLocalNftImageSrc } from '@/lib/nft-local-image'
import {
  computePowerLevel,
  type CapyTraits,
  rarityFromTokenId,
  RARITY_XP_BOOST,
  type RarityTier,
} from '@/lib/capycamp-rarity'

/** OpenSea v2 chain slug — CapyCamp is deployed on Abstract mainnet */
export function getOpenSeaChain(): string {
  return (process.env.OPENSEA_CHAIN || 'abstract').trim().toLowerCase()
}

type OpenSeaNft = {
  identifier: string
  name: string | null
  image_url: string | null
  contract: { address: string }
}

export type CapyNft = {
  tokenId: string
  name: string
  image: string | null
  contract: string
  rarity: RarityTier
  traits: CapyTraits
  powerLevel: number
  xpBoostPercent: number
  /** Full metadata traits for flip card */
  allTraits: { trait_type: string; value: string }[]
}

function bareCapyNft(tokenId: string, name: string): CapyNft {
  const rarity = rarityFromTokenId(tokenId)
  const traits: CapyTraits = { hat: '—', outfit: '—', background: '—' }
  return {
    tokenId,
    name,
    image: getLocalNftImageSrc(tokenId),
    contract: CAPYCAMP_CONTRACT.toLowerCase(),
    rarity,
    traits,
    powerLevel: computePowerLevel(rarity, traits),
    xpBoostPercent: RARITY_XP_BOOST[rarity],
    allTraits: [],
  }
}

function capycampFromNfts(nfts: OpenSeaNft[], limit: number): CapyNft[] {
  return nfts
    .filter(
      (nft) =>
        nft?.contract?.address?.toLowerCase() === CAPYCAMP_CONTRACT.toLowerCase(),
    )
    .slice(0, limit)
    .map((nft) =>
      bareCapyNft(nft.identifier, nft.name ?? `CapyCamp #${nft.identifier}`),
    )
}

/** Paginate OpenSea account NFTs until we have enough CapyCamp or no next page */
export async function fetchCapycampersFromOpenSea(
  owner: string,
  apiKey: string,
  options: { revalidateSeconds?: number; limit?: number } = {},
): Promise<CapyNft[]> {
  const chain = getOpenSeaChain()
  const revalidate = options.revalidateSeconds ?? 60
  const limit = options.limit ?? 20
  const collected: OpenSeaNft[] = []
  let url: string | null =
    `https://api.opensea.io/api/v2/chain/${chain}/account/${encodeURIComponent(owner)}/nfts?limit=200`

  while (url && collected.length < 500) {
    const res: Response = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenSea ${res.status}: ${text.slice(0, 300)}`)
    }
    const json: { nfts?: OpenSeaNft[]; next?: string } = await res.json()
    const page: OpenSeaNft[] = Array.isArray(json?.nfts) ? json.nfts : []
    collected.push(...page)

    const capy = capycampFromNfts(collected, limit)
    if (capy.length >= limit) return capy.slice(0, limit)

    const nextUrl: string | undefined = json?.next
    if (!nextUrl || typeof nextUrl !== 'string') break
    url = nextUrl.startsWith('http') ? nextUrl : `https://api.opensea.io${nextUrl}`
  }

  return capycampFromNfts(collected, limit)
}

/** Ownership check: wallet holds this token on CapyCamp contract (same chain) */
export async function ownsCapyCampOnOpenSea(
  wallet: string,
  tokenId: string,
  apiKey: string,
): Promise<boolean> {
  const chain = getOpenSeaChain()
  let url: string | null =
    `https://api.opensea.io/api/v2/chain/${chain}/account/${encodeURIComponent(wallet)}/nfts?limit=200`

  while (url) {
    const res: Response = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json: { nfts?: OpenSeaNft[]; next?: string } = await res.json()
    const nfts: OpenSeaNft[] = Array.isArray(json?.nfts) ? json.nfts : []
    const found = nfts.some(
      (nft) =>
        nft?.contract?.address?.toLowerCase() === CAPYCAMP_CONTRACT.toLowerCase() &&
        String(nft.identifier) === String(tokenId),
    )
    if (found) return true

    const nextUrl: string | undefined = json?.next
    if (!nextUrl || typeof nextUrl !== 'string') break
    url = nextUrl.startsWith('http') ? nextUrl : `https://api.opensea.io${nextUrl}`
  }
  return false
}
