// Simple in-memory store for daily rewards.
// In production, replace this with a real database (users, daily_claims, reward_events tables).

export type DailyClaimRecord = {
  address: string
  lastClaimDate: string // YYYY-MM-DD in UTC
  streak: number
}

export type RewardEvent = {
  id: string
  address: string
  claimedAt: string // ISO timestamp in UTC
  rewardType: 'daily'
  streakAfterClaim: number
}

// Keyed by lowercase address
const dailyClaims = new Map<string, DailyClaimRecord>()
const rewardEvents: RewardEvent[] = []

export function getDailyClaim(address: string): DailyClaimRecord | undefined {
  return dailyClaims.get(address.toLowerCase())
}

export function upsertDailyClaim(record: DailyClaimRecord) {
  dailyClaims.set(record.address.toLowerCase(), record)
}

export function addRewardEvent(event: RewardEvent) {
  rewardEvents.push(event)
}

export function getTodayUtcDateString(): string {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

export function getYesterdayUtcDateString(): string {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - 1)
  return now.toISOString().slice(0, 10)
}

export function getNextUtcMidnight(): Date {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
  return next
}

