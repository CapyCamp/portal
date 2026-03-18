'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import type { CapyTraits, RarityTier } from '@/lib/capycamp-rarity'
import type { PersistedProfile } from '@/lib/profile-local-storage'
import { readProfileSnapshot } from '@/lib/profile-local-storage'

export type CapyNft = {
  tokenId: string
  name: string
  image: string | null
  contract: string
  rarity: RarityTier
  traits: CapyTraits
  powerLevel: number
  xpBoostPercent: number
  allTraits?: { trait_type: string; value: string }[]
}

type ApiResponse = {
  nfts: CapyNft[]
}

export function useCapyNFTs() {
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState<CapyNft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const limit = 200

  useEffect(() => {
    if (!address || !isConnected) {
      setNfts([])
      setError(null)
      return
    }

    // Seed from local cache (instant UI), then refresh from API.
    const cacheKey = `capycamp-nfts:${address.toLowerCase()}:limit=${limit}`
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { nfts?: CapyNft[]; cachedAt?: number }
        if (Array.isArray(parsed?.nfts) && parsed.nfts.length > 0) {
          setNfts(parsed.nfts)
        }
      }
    } catch {
      // ignore
    }

    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/nfts/${address}?limit=${encodeURIComponent(String(limit))}`, { cache: 'no-store' })
        const body = await res.json()
        if (!res.ok) {
          throw new Error(body?.error || 'Failed to fetch CapyCamp NFTs')
        }
        if (!cancelled) {
          const data = body as ApiResponse & { error?: string; hint?: string }
          setNfts(Array.isArray(data.nfts) ? data.nfts : [])
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ nfts: data.nfts ?? [], cachedAt: Date.now() }))
          } catch {
            // ignore
          }
          if (data.hint && (!data.nfts || data.nfts.length === 0)) {
            setError(data.hint)
          } else if (data.error && (!data.nfts || data.nfts.length === 0)) {
            setError(data.hint || data.error)
          } else {
            setError(null)
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch CapyCamp NFTs')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  return { nfts, loading, error, isConnected, address }
}
