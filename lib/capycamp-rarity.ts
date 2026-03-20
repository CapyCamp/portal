/**
 * CapyCamp NFT rarity, traits, and power level.
 */

export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary'

export type CapyTraits = {
  hat: string
  outfit: string
  background: string
}

export const RARITY_XP_BOOST: Record<RarityTier, number> = {
  common: 0,
  rare: 5,
  epic: 10,
  legendary: 20,
}

export const RARITY_ORDER: Record<RarityTier, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

export const RARITY_BASE_POWER: Record<RarityTier, number> = {
  common: 18,
  rare: 38,
  epic: 62,
  legendary: 92,
}

const RARITY_ALIASES: Record<string, RarityTier> = {
  common: 'common',
  '': 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
}

/**
 * Trait types that describe card/tier level (not cosmetic slots).
 * Used so "Special" on Rarity/Edition/etc. maps to Legendary.
 */
const TIER_TRAIT_TYPES =
  /rarity|tier|rank|edition|series|card type|category|variant|collection|grade|class/i

/** Cosmetic slots — value "Special" here must NOT force legendary */
const COSMETIC_TRAIT_TYPES = /^(hat|head|cap|outfit|body|clothes|shirt|background|bg|scene)$/i

/**
 * Map metadata value → tier. Special / Mythic / 1-of-1 → Legendary for XP.
 */
export function normalizeRarity(value: string | undefined | null): RarityTier {
  if (!value || typeof value !== 'string') return 'common'
  const k = value.trim().toLowerCase()
  if (!k) return 'common'

  if (k in RARITY_ALIASES) return RARITY_ALIASES[k] as RarityTier

  // Special trait cards → Legendary (+20% XP)
  if (k === 'special' || k.startsWith('special ') || k.includes('special edition')) {
    return 'legendary'
  }
  if (
    k === 'mythic' ||
    k === 'ultimate' ||
    k === 'unique' ||
    k.includes('1/1') ||
    k.includes('one of one') ||
    k.includes('god tier') ||
    k === 'grail'
  ) {
    return 'legendary'
  }

  if (k.includes('legend')) return 'legendary'
  if (k.includes('epic')) return 'epic'
  if (k.includes('rare') && !k.includes('ultra')) return 'rare'
  if (k.includes('ultra rare') || k === 'ultra') return 'epic'
  if (k.includes('uncommon')) return 'rare'

  return 'common'
}

function maxTier(a: RarityTier, b: RarityTier): RarityTier {
  return RARITY_ORDER[a] >= RARITY_ORDER[b] ? a : b
}

/** Deterministic fallback when metadata has no tier info */
export function rarityFromTokenId(tokenId: string): RarityTier {
  let h = 0
  for (let i = 0; i < tokenId.length; i++) h = ((h << 5) - h + tokenId.charCodeAt(i)) | 0
  const x = Math.abs(h) % 100
  if (x < 52) return 'common'
  if (x < 78) return 'rare'
  if (x < 94) return 'epic'
  return 'legendary'
}

function norm(s: unknown): string {
  if (s == null) return '—'
  const t = String(s).trim()
  return t || '—'
}

function findTrait(
  attributes: { trait_type?: string; value?: unknown }[] | undefined,
  ...keys: string[]
): string {
  if (!attributes?.length) return '—'
  const lower = keys.map((k) => k.toLowerCase())
  for (const a of attributes) {
    const type = String(a.trait_type ?? '').toLowerCase()
    if (lower.some((key) => type === key || type.includes(key))) {
      return norm(a.value)
    }
  }
  return '—'
}

/**
 * Best rarity from full metadata: any tier-like attribute, including Rarity: Special.
 */
export function inferRarityFromAttributes(
  attributes: { trait_type?: string; value?: unknown }[] | undefined,
  tokenId: string,
): RarityTier {
  if (!attributes?.length) {
    return rarityFromTokenId(tokenId)
  }

  let best: RarityTier = 'common'

  for (const a of attributes) {
    const traitType = String(a.trait_type ?? '').trim()
    const traitTypeLower = traitType.toLowerCase()
    const rawVal = a.value
    const valStr = typeof rawVal === 'string' ? rawVal.trim() : String(rawVal ?? '').trim()
    const valLower = valStr.toLowerCase()

    // Entire trait named "Special" (e.g. "Special card" flag) → Legendary
    if (traitTypeLower === 'special') {
      if (
        valLower === 'yes' ||
        valLower === 'true' ||
        valLower === '1' ||
        valLower === 'legendary'
      ) {
        best = maxTier(best, 'legendary')
      } else if (valLower && valLower !== 'no' && valLower !== 'false' && valLower !== '0') {
        best = maxTier(best, 'legendary')
      }
      continue
    }

    if (COSMETIC_TRAIT_TYPES.test(traitTypeLower)) {
      continue
    }

    if (!valStr) continue

    if (TIER_TRAIT_TYPES.test(traitTypeLower)) {
      best = maxTier(best, normalizeRarity(valStr))
      if (valLower === 'special') {
        best = maxTier(best, 'legendary')
      }
      continue
    }

    // Type / Kind: Special (card class)
    if (
      (traitTypeLower === 'type' || traitTypeLower === 'kind' || traitTypeLower === 'card') &&
      valLower === 'special'
    ) {
      best = maxTier(best, 'legendary')
    }

    // Plain value "Special" on a non-cosmetic line still counts (e.g. odd schema)
    if (valLower === 'special' && !COSMETIC_TRAIT_TYPES.test(traitTypeLower)) {
      best = maxTier(best, 'legendary')
    }
  }

  // Explicit Rarity / Tier / Rank first row wins if we only had cosmetics before
  const explicit = findTrait(attributes, 'rarity', 'tier', 'rank')
  if (explicit && explicit !== '—') {
    best = maxTier(best, normalizeRarity(explicit))
  }

  if (best === 'common') {
    return rarityFromTokenId(tokenId)
  }
  return best
}

/** Single row for UI (flip card, OpenSea-style). */
export type TraitRow = { trait_type: string; value: string }

/**
 * Flatten OpenSea `attributes` plus optional `properties` object so every trait shows on flip.
 */
export function normalizeAttributeRows(
  attributes: { trait_type?: string; name?: string; value?: unknown }[] | undefined,
  properties?: Record<string, unknown> | null,
): TraitRow[] {
  const rows: TraitRow[] = []
  const seen = new Set<string>()

  if (attributes?.length) {
    for (const a of attributes) {
      const key = String(a.trait_type ?? a.name ?? 'Trait').trim() || 'Trait'
      let val: unknown = a.value
      if (val === undefined || val === null) continue
      if (typeof val === 'object' && !Array.isArray(val))
        val = JSON.stringify(val)
      const valueStr = Array.isArray(val) ? val.join(', ') : String(val).trim()
      const dedupe = `${key.toLowerCase()}::${valueStr.toLowerCase()}`
      if (seen.has(dedupe)) continue
      seen.add(dedupe)
      rows.push({ trait_type: key, value: valueStr || '—' })
    }
  }

  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    for (const [k, v] of Object.entries(properties)) {
      if (v === undefined || v === null || k.startsWith('_')) continue
      const valueStr =
        typeof v === 'object' ? JSON.stringify(v) : String(v).trim()
      const dedupe = `${k.toLowerCase()}::${valueStr.toLowerCase()}`
      if (seen.has(dedupe)) continue
      seen.add(dedupe)
      rows.push({ trait_type: k, value: valueStr || '—' })
    }
  }

  return rows
}

export type ParsedMetadata = {
  name: string
  image: string | null
  rarity: RarityTier
  traits: CapyTraits
  powerLevel: number
  xpBoostPercent: number
  /** Every metadata trait for flip-back UI */
  allTraits: TraitRow[]
}

export function parseAttributesToTraits(
  attributes: { trait_type?: string; name?: string; value?: unknown }[] | undefined,
  tokenId: string,
  nameFallback: string,
  image: string | null,
  properties?: Record<string, unknown> | null,
): ParsedMetadata {
  const rarity = inferRarityFromAttributes(attributes, tokenId)
  const allTraits = normalizeAttributeRows(attributes, properties)

  const traits: CapyTraits = {
    hat: findTrait(attributes, 'hat', 'head', 'cap'),
    outfit: findTrait(attributes, 'outfit', 'body', 'clothes', 'shirt'),
    background: findTrait(attributes, 'background', 'bg', 'scene'),
  }

  const xpBoostPercent = RARITY_XP_BOOST[rarity]
  const powerLevel = computePowerLevel(rarity, traits)

  return {
    name: nameFallback,
    image,
    rarity,
    traits,
    powerLevel,
    xpBoostPercent,
    allTraits,
  }
}

export function computePowerLevel(rarity: RarityTier, traits: CapyTraits): number {
  let score = RARITY_BASE_POWER[rarity]
  const add = (v: string) => {
    if (!v || v === '—') return
    score += Math.min(18, 6 + Math.min(v.length, 12))
  }
  add(traits.hat)
  add(traits.outfit)
  add(traits.background)
  const filled = [traits.hat, traits.outfit, traits.background].filter((t) => t && t !== '—').length
  if (filled >= 3) score += 12
  return Math.min(999, score)
}

export function rarityGlowClass(rarity: RarityTier): string {
  switch (rarity) {
    case 'legendary':
      return 'shadow-[0_0_28px_rgba(234,179,8,0.85)] ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-950/20'
    case 'epic':
      return 'shadow-[0_0_24px_rgba(168,85,247,0.8)] ring-2 ring-purple-500 ring-offset-2 ring-offset-purple-950/10'
    case 'rare':
      return 'shadow-[0_0_22px_rgba(59,130,246,0.75)] ring-2 ring-blue-500 ring-offset-2 ring-offset-blue-950/10'
    default:
      return 'ring-1 ring-slate-300/80'
  }
}

/** Pill/badge styles — match NFT card rarity (Legendary = amber/gold, not purple). */
export const RARITY_BADGE_CLASSES: Record<RarityTier, string> = {
  common: 'bg-slate-500/90 text-white',
  rare: 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.45)]',
  epic: 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.45)]',
  legendary:
    'bg-linear-to-r from-amber-500 to-orange-600 text-amber-950 shadow-[0_0_14px_rgba(234,179,8,0.55)] font-extrabold',
}

export function rarityLabel(rarity: RarityTier): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}
