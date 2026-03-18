import { NextResponse } from 'next/server'
import { CAPYCAMP_CONTRACT } from '@/config/capycamp'
import { parseAttributesToTraits, RARITY_XP_BOOST, computePowerLevel } from '@/lib/capycamp-rarity'
import { fetchCapyMetadataForToken, ownsCapyCampOnChain } from '@/lib/capycamp-onchain'
import { getOpenSeaChain, ownsCapyCampOnOpenSea } from '@/lib/opensea-capycamp'
import { getProfile, upsertProfile } from '../store'

type Body = {
  wallet?: string
  tokenId?: string
  image?: string | null
  contract?: string
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

async function ownsCapyNftAlchemy(wallet: string, tokenId: string, apiKey: string): Promise<boolean> {
  const base = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`
  const url = new URL(base)
  url.searchParams.set('owner', wallet)
  url.searchParams.append('contractAddresses[]', CAPYCAMP_CONTRACT)
  url.searchParams.set('pageSize', '100')
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return false
  const json = await res.json()
  const owned = Array.isArray(json?.ownedNfts) ? json.ownedNfts : []
  return owned.some((nft: { tokenId?: string }) => String(nft.tokenId) === String(tokenId))
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  const wallet = body?.wallet?.toLowerCase()
  const tokenId = body?.tokenId
  const image = body?.image ?? null
  const contract = body?.contract?.toLowerCase()

  if (!wallet || !tokenId || !contract) {
    return NextResponse.json({ error: 'Missing wallet, tokenId, or contract' }, { status: 400 })
  }

  if (!isValidAddress(wallet) || !isValidAddress(contract)) {
    return NextResponse.json({ error: 'Invalid wallet or contract address' }, { status: 400 })
  }

  if (contract !== CAPYCAMP_CONTRACT.toLowerCase()) {
    return NextResponse.json({ error: 'Only CapyCamp NFTs can be used as avatars' }, { status: 400 })
  }

  const openseaKey = process.env.OPENSEA_API_KEY
  const alchemyKey = process.env.ALCHEMY_API_KEY
  const chain = getOpenSeaChain()

  try {
    const onChain = await ownsCapyCampOnChain(wallet, tokenId)
    let ownsNft = onChain
    if (!ownsNft && openseaKey) {
      ownsNft = await ownsCapyCampOnOpenSea(wallet, tokenId, openseaKey)
    }
    if (!ownsNft && alchemyKey && chain === 'ethereum') {
      ownsNft = await ownsCapyNftAlchemy(wallet, tokenId, alchemyKey)
    }

    if (!ownsNft) {
      return NextResponse.json(
        { error: 'Wallet does not own this CapyCamp NFT on Abstract (on-chain check).' },
        { status: 403 },
      )
    }

    const meta = await fetchCapyMetadataForToken(tokenId)
    const fallback = parseAttributesToTraits(undefined, tokenId, `CapyCamp #${tokenId}`, image, null)
    const rarity = meta?.rarity ?? fallback.rarity
    const traits = meta?.traits ?? fallback.traits
    const powerLevel = meta?.powerLevel ?? computePowerLevel(rarity, traits)
    const xpBoost = meta?.xpBoostPercent ?? RARITY_XP_BOOST[rarity]
    const existing = getProfile(wallet)
    const alreadyGranted = existing?.xpBonusGranted ?? false

    const updated = {
      wallet,
      pfp_image: meta?.image ?? image,
      pfp_token_id: tokenId,
      pfp_contract: contract,
      pfp_rarity: rarity,
      pfp_traits: traits,
      pfp_power_level: powerLevel,
      xp_boost_percent: xpBoost,
      xpBonusGranted: alreadyGranted || true,
    }

    upsertProfile({ ...existing, ...updated, wallet })
    return NextResponse.json(getProfile(wallet))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Unexpected error verifying ownership', message },
      { status: 500 },
    )
  }
}
