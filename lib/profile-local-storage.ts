/**
 * Persist profile (PFP + settings) in localStorage so it survives
 * server restarts / cold starts (in-memory API store).
 */

import { CAPYCAMP_CONTRACT } from '@/config/capycamp'

const PREFIX = 'capycamp-profile:'

export type PersistedProfile = {
  wallet: string
  display_name?: string
  profile_bg_from?: string
  profile_bg_to?: string
  pfp_image?: string | null
  pfp_token_id?: string | null
  pfp_contract?: string | null
  pfp_rarity?: string
  pfp_power_level?: number
  xp_boost_percent?: number
  xp?: number
  /** Last daily holdings XP claim (ms), mirrored from server + local merge for serverless reliability */
  last_claim?: number
  claimed_badges?: string[]
}

function key(wallet: string) {
  return `${PREFIX}${wallet.toLowerCase()}`
}

export function persistProfileSnapshot(wallet: string, profile: Partial<PersistedProfile> & { wallet?: string }) {
  if (typeof window === 'undefined' || !wallet) return
  try {
    const prev = readProfileSnapshot(wallet) || { wallet: wallet.toLowerCase() }
    const next = {
      ...prev,
      ...profile,
      wallet: wallet.toLowerCase(),
    }
    localStorage.setItem(key(wallet), JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}

export function readProfileSnapshot(wallet: string): PersistedProfile | null {
  if (typeof window === 'undefined' || !wallet) return null
  try {
    const raw = localStorage.getItem(key(wallet))
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedProfile
    if (!data || data.wallet?.toLowerCase() !== wallet.toLowerCase()) return null
    return data
  } catch {
    return null
  }
}

export function clearProfileSnapshot(wallet: string) {
  if (typeof window === 'undefined' || !wallet) return
  try {
    localStorage.removeItem(key(wallet))
  } catch {
    /* ignore */
  }
}

const RESTORE_DONE_KEY = 'capycamp-restore-done'

/** Only run restore writes (POST) once per page load so we don't overwrite settings repeatedly. */
function shouldSkipRestoreWrites(wallet: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(RESTORE_DONE_KEY)
    if (!raw) return false
    const done = JSON.parse(raw) as string[]
    return Array.isArray(done) && done.includes(wallet.toLowerCase())
  } catch {
    return false
  }
}

function markRestoreDone(wallet: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = sessionStorage.getItem(RESTORE_DONE_KEY) || '[]'
    const done = JSON.parse(raw) as string[]
    const key = wallet.toLowerCase()
    if (!done.includes(key)) {
      sessionStorage.setItem(RESTORE_DONE_KEY, JSON.stringify([...done, key]))
    }
  } catch {
    /* ignore */
  }
}

/**
 * If server lost in-memory profile, re-apply PFP (on-chain verify) + settings from localStorage.
 * Writes (POST) only run once per session per wallet to avoid resetting user edits.
 */
export async function restoreProfileIfNeeded(address: string): Promise<Record<string, unknown>> {
  const wallet = address.toLowerCase()
  const statusRes = await fetch(`/api/profile/status?address=${encodeURIComponent(address)}`)
  if (!statusRes.ok) return { wallet }
  let api = (await statusRes.json()) as PersistedProfile & { wallet: string }
  const local = readProfileSnapshot(address)
  if (!local) return api as Record<string, unknown>

  const skipWrites = shouldSkipRestoreWrites(wallet)

  const serverHasPfp = Boolean(api.pfp_token_id)
  const localHasPfp =
    Boolean(local.pfp_token_id) &&
    (local.pfp_contract?.toLowerCase() ?? '') === CAPYCAMP_CONTRACT.toLowerCase()

  if (!skipWrites && !serverHasPfp && localHasPfp && local.pfp_token_id) {
    const setRes = await fetch('/api/profile/set-pfp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        tokenId: local.pfp_token_id,
        image: local.pfp_image ?? null,
        contract: local.pfp_contract ?? CAPYCAMP_CONTRACT,
      }),
    })
    if (setRes.ok) {
      api = (await setRes.json()) as PersistedProfile & { wallet: string }
      persistProfileSnapshot(address, api)
      markRestoreDone(wallet)
    } else {
      persistProfileSnapshot(address, {
        wallet,
        display_name: local.display_name,
        profile_bg_from: local.profile_bg_from,
        profile_bg_to: local.profile_bg_to,
      })
    }
  }

  const needsSettings =
    !skipWrites &&
    ((local.display_name && !api.display_name) ||
      (local.profile_bg_from && !api.profile_bg_from) ||
      (local.profile_bg_to && !api.profile_bg_to))

  if (needsSettings) {
    await fetch('/api/profile/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        displayName: local.display_name ?? api.display_name,
        bgFrom: local.profile_bg_from ?? undefined,
        bgTo: local.profile_bg_to ?? undefined,
      }),
    })
    markRestoreDone(wallet)
  }

  const again = await fetch(`/api/profile/status?address=${encodeURIComponent(address)}`)
  if (again.ok) {
    api = (await again.json()) as PersistedProfile & { wallet: string }
    if (!skipWrites) persistProfileSnapshot(address, api)
  }

  return api as Record<string, unknown>
}
