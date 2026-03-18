import type { RarityTier } from '@/lib/capycamp-rarity'

/** Daily XP per CapyCamp NFT held (every 24h). Sum over all held NFTs. e.g. 20 Rare = 100 XP/day. */
export const XP_REWARDS: Record<RarityTier, number> = {
  common: 0,
  rare: 5,
  epic: 10,
  legendary: 20,
}

export const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000

/** Daily Login Streak: 10 XP per day; 50 XP bonus on 7th consecutive day. */
export const STREAK_XP_PER_DAY = 10
export const STREAK_DAY_7_BONUS_XP = 50
