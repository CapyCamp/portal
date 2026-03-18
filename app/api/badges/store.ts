export type ClaimedBadgeRecord = {
  address: string
  slugs: string[]
}

// In-memory claimed badges store.
// In production, replace with a real DB table keyed by wallet.
const claimedBadges = new Map<string, Set<string>>()

import { getProfile, patchProfile } from '@/app/api/profile/store'

export function getClaimedBadges(address: string): Set<string> {
  const key = address.toLowerCase()
  return claimedBadges.get(key) ?? new Set<string>()
}

export function hasClaimedBadge(address: string, slug: string): boolean {
  return getClaimedBadges(address).has(slug)
}

export function claimBadge(address: string, slug: string) {
  const key = address.toLowerCase()
  const set = claimedBadges.get(key) ?? new Set<string>()
  set.add(slug)
  claimedBadges.set(key, set)

  const prev = getProfile(key)?.claimed_badges ?? []
  if (!prev.includes(slug)) {
    patchProfile(key, { claimed_badges: [...prev, slug] })
  }
}

