import type { CapyTraits, RarityTier } from '@/lib/capycamp-rarity'

export type ProfileRecord = {
  wallet: string
  /** Camper display name (overrides portal default for this app) */
  display_name?: string
  /** Card gradient — hex */
  profile_bg_from?: string
  profile_bg_to?: string
  pfp_image?: string | null
  pfp_token_id?: string | null
  pfp_contract?: string | null
  pfp_rarity?: RarityTier
  pfp_traits?: CapyTraits
  pfp_power_level?: number
  /** Claimed badge slugs (persisted via client snapshot + sync). */
  claimed_badges?: string[]
}

const profiles = new Map<string, ProfileRecord>()

import {
  DEFAULT_PROFILE_BG_FROM,
  DEFAULT_PROFILE_BG_TO,
} from '@/lib/profile-defaults'

export const DEFAULT_BG_FROM = DEFAULT_PROFILE_BG_FROM
export const DEFAULT_BG_TO = DEFAULT_PROFILE_BG_TO

export function getProfile(wallet: string): ProfileRecord | undefined {
  return profiles.get(wallet.toLowerCase())
}

export function upsertProfile(record: ProfileRecord) {
  const key = record.wallet.toLowerCase()
  const prev = profiles.get(key)
  profiles.set(key, { ...prev, ...record, wallet: key })
}

/** Merge partial fields without wiping PFP/settings */
export function patchProfile(wallet: string, patch: Partial<ProfileRecord>) {
  const key = wallet.toLowerCase()
  const prev = profiles.get(key) || { wallet: key }
  profiles.set(key, { ...prev, ...patch, wallet: key })
}
