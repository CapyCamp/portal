import { persistProfileSnapshot, readProfileSnapshot, type PersistedProfile } from '@/lib/profile-local-storage'

/** Response shape from `POST /api/xp/claim` */
export type XpClaimApiResponse = {
  claimed?: boolean
  xpGained?: number
  totalXp?: number
  lastClaim?: number
  nextClaimAt?: number
  nftCount?: number
  xpPerDay?: number
  reason?: string
}

export function xpClaimRequestBody(wallet: string): Record<string, unknown> {
  const snap = readProfileSnapshot(wallet)
  return {
    wallet,
    clientXp: typeof snap?.xp === 'number' && snap.xp >= 0 ? snap.xp : undefined,
    clientLastClaim:
      typeof snap?.last_claim === 'number' && snap.last_claim >= 0 ? snap.last_claim : undefined,
  }
}

/**
 * Merge API XP into localStorage so we never drop XP when the serverless store is cold
 * or when NFT fetch fails (totalXp may still reflect merged baseline).
 */
export function applyXpClaimToSnapshot(wallet: string, data: XpClaimApiResponse): void {
  if (typeof data.totalXp !== 'number' || !Number.isFinite(data.totalXp)) return
  const prev = readProfileSnapshot(wallet) || { wallet: wallet.toLowerCase() }
  const mergedXp = Math.max(prev.xp ?? 0, data.totalXp)
  const next: Partial<PersistedProfile> & { wallet: string } = {
    ...prev,
    wallet: wallet.toLowerCase(),
    xp: mergedXp,
  }
  if (typeof data.lastClaim === 'number' && Number.isFinite(data.lastClaim) && data.lastClaim >= 0) {
    next.last_claim = Math.max(prev.last_claim ?? 0, data.lastClaim)
  }
  persistProfileSnapshot(wallet, next)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('capycamp-xp-updated'))
  }
}

/** Rewards countdown uses server `last_claim`; merge client hints for cold serverless instances. */
export function rewardsStatusUrlForWallet(address: string): string {
  const snap = readProfileSnapshot(address)
  const q = new URLSearchParams({ address })
  if (typeof snap?.last_claim === 'number' && snap.last_claim >= 0) {
    q.set('clientLastClaim', String(snap.last_claim))
  }
  if (typeof snap?.xp === 'number' && snap.xp >= 0) {
    q.set('clientXp', String(snap.xp))
  }
  return `/api/rewards/status?${q.toString()}`
}
