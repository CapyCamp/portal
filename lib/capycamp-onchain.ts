import { createPublicClient, http, parseAbiItem, type Address } from 'viem'
import { abstract } from 'viem/chains'
import { CAPYCAMP_CONTRACT } from '@/config/capycamp'
import { parseAttributesToTraits } from '@/lib/capycamp-rarity'
import type { CapyNft } from '@/lib/opensea-capycamp'

const contract = CAPYCAMP_CONTRACT as Address
// We start with a fast lookback window, but widen automatically if the wallet
// has a non-zero balance and we don't find any recent Transfer logs.
const TRANSFER_LOG_LOOKBACK_STEPS: bigint[] = [
  BigInt(250_000),
  BigInt(2_000_000),
  BigInt(10_000_000),
]

/** Minimal ERC721 + Enumerable + tokenURI */
const abi = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

function client() {
  return createPublicClient({
    chain: abstract,
    transport: http(abstract.rpcUrls.default.http[0]),
  })
}

function resolveTokenUri(uri: string): string {
  const u = uri.trim()
  if (u.startsWith('ipfs://')) {
    const hash = u.slice('ipfs://'.length).replace(/^ipfs\//, '')
    return `https://ipfs.io/ipfs/${hash}`
  }
  return u
}

type JsonMetadata = {
  name?: string
  image?: string
  attributes?: { trait_type?: string; name?: string; value?: unknown }[]
  properties?: Record<string, unknown>
}

/** Full CapyCamp metadata for one token (for listings + set-pfp). */
export async function fetchCapyMetadataForToken(tokenId: string): Promise<CapyNft | null> {
  try {
    const c = client()
    const uri = await c.readContract({
      address: contract,
      abi,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })
    if (!uri) return null
    const url = resolveTokenUri(uri)
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as JsonMetadata
    let image: string | null = json.image ?? null
    if (image?.startsWith('ipfs://')) {
      const h = image.slice('ipfs://'.length).replace(/^ipfs\//, '')
      image = `https://ipfs.io/ipfs/${h}`
    }
    const name = json.name?.trim() || `CapyCamp #${tokenId}`
    const parsed = parseAttributesToTraits(
      json.attributes,
      tokenId,
      name,
      image,
      json.properties ?? null,
    )
    return {
      tokenId,
      name: parsed.name,
      image: parsed.image,
      contract: CAPYCAMP_CONTRACT.toLowerCase(),
      rarity: parsed.rarity,
      traits: parsed.traits,
      powerLevel: parsed.powerLevel,
      xpBoostPercent: parsed.xpBoostPercent,
      allTraits: parsed.allTraits,
    }
  } catch {
    return null
  }
}

async function metadataFromTokenUri(tokenId: string): Promise<CapyNft> {
  const full = await fetchCapyMetadataForToken(tokenId)
  if (full) return full
  const p = parseAttributesToTraits(undefined, tokenId, `CapyCamp #${tokenId}`, null, null)
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

async function tokenIdsViaEnumerable(
  c: ReturnType<typeof client>,
  owner: Address,
  balance: bigint,
  limit: number,
): Promise<string[]> {
  const n = Number(balance)
  if (n <= 0) return []
  const max = Math.min(n, limit)
  const tokenIds: string[] = []
  for (let i = 0; i < max; i++) {
    const id = await c.readContract({
      address: contract,
      abi,
      functionName: 'tokenOfOwnerByIndex',
      args: [owner, BigInt(i)],
    })
    tokenIds.push(id.toString())
  }
  return tokenIds
}

/** Non-enumerable ERC721: tokens ever received by owner, filtered by ownerOf */
async function tokenIdsViaTransferLogsInRange(
  c: ReturnType<typeof client>,
  owner: Address,
  fromBlock: bigint,
  limit: number,
): Promise<string[]> {
  const transfer = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  )
  const logs = await c.getLogs({
    address: contract,
    event: transfer,
    args: { to: owner },
    fromBlock,
    toBlock: 'latest',
  })
  const seen = new Set<string>()
  for (const log of logs) {
    const id = log.args.tokenId
    if (id === undefined) continue
    const tid = id.toString()
    if (seen.has(tid)) continue
    try {
      const o = await c.readContract({
        address: contract,
        abi,
        functionName: 'ownerOf',
        args: [id],
      })
      if (o.toLowerCase() === owner.toLowerCase()) seen.add(tid)
    } catch {
      /* burned */
    }
    if (seen.size >= limit) break
  }
  return Array.from(seen).slice(0, limit)
}

async function tokenIdsViaTransferLogsProgressive(
  c: ReturnType<typeof client>,
  owner: Address,
  limit: number,
): Promise<string[]> {
  const latest = await c.getBlockNumber()
  const outSeen = new Set<string>()

  for (const lookback of TRANSFER_LOG_LOOKBACK_STEPS) {
    const fromBlock = latest > lookback ? latest - lookback : BigInt(0)
    const remaining = Math.max(0, limit - outSeen.size)
    if (remaining <= 0) break

    const ids = await tokenIdsViaTransferLogsInRange(c, owner, fromBlock, remaining)
    for (const id of ids) outSeen.add(id)

    if (outSeen.size >= limit) break
    if (fromBlock === BigInt(0)) break
  }

  // Last resort: full history to fill missing (slow but accurate).
  if (outSeen.size < limit) {
    const remaining = Math.max(0, limit - outSeen.size)
    const ids = await tokenIdsViaTransferLogsInRange(c, owner, BigInt(0), remaining)
    for (const id of ids) outSeen.add(id)
  }

  return Array.from(outSeen).slice(0, limit)
}

/**
 * List CapyCamp NFTs owned by `owner` on Abstract via RPC.
 */
export async function fetchCapycampersOnChain(ownerAddress: string, limit: number): Promise<CapyNft[]> {
  const owner = ownerAddress.toLowerCase() as Address
  const c = client()
  let tokenIds: string[] = []
  try {
    const balance = await c.readContract({
      address: contract,
      abi,
      functionName: 'balanceOf',
      args: [owner],
    })
    if (balance === BigInt(0)) return []
    try {
      tokenIds = await tokenIdsViaEnumerable(c, owner, balance, limit)
    } catch {
      tokenIds = await tokenIdsViaTransferLogsProgressive(c, owner, limit)
    }
    if (tokenIds.length === 0) return []
    const out: CapyNft[] = []
    for (const tokenId of tokenIds) {
      const meta = await metadataFromTokenUri(tokenId)
      if (meta) out.push(meta)
    }
    return out
  } catch {
    return []
  }
}

export async function ownsCapyCampOnChain(wallet: string, tokenId: string): Promise<boolean> {
  try {
    const c = client()
    const owner = await c.readContract({
      address: contract,
      abi,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    })
    return owner.toLowerCase() === wallet.toLowerCase()
  } catch {
    return false
  }
}
