import { NextResponse } from 'next/server'
import { getAllProfiles } from '@/app/api/profile/store'

/**
 * Leaderboard synced with profile XP (same store as daily XP claims).
 * Rank 1 = highest XP. Updates when users claim daily XP.
 */
export async function GET() {
  const profiles = getAllProfiles()
  const withXp = profiles.map((p) => ({
    wallet: p.wallet,
    displayName: p.display_name ?? null,
    xp: typeof p.xp === 'number' && p.xp >= 0 ? p.xp : 0,
    pfpImage: p.pfp_image ?? null,
    pfpRarity: p.pfp_rarity ?? null,
  }))
  const sorted = withXp.sort((a, b) => b.xp - a.xp)
  const leaderboard = sorted.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }))
  return NextResponse.json(leaderboard)
}
