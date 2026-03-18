'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { persistProfileSnapshot, readProfileSnapshot, restoreProfileIfNeeded } from '@/lib/profile-local-storage'

type LeaderboardEntry = {
  rank: number
  wallet: string
  displayName: string | null
  xp: number
  pfpImage: string | null
  pfpRarity: string | null
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

/** Refetch interval (ms) so leaderboard stays in sync with XP (same cadence as daily claims). */
const REFETCH_MS = 60 * 1000

function displayName(entry: LeaderboardEntry): string {
  if (entry.displayName?.trim()) return entry.displayName.trim()
  return `${entry.wallet.slice(0, 6)}…${entry.wallet.slice(-4)}`
}

export default function LeaderboardPage() {
  const { address } = useAccount()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    if (address) {
      // Restore first so we don't accidentally sync stale/empty XP.
      const restored = (await restoreProfileIfNeeded(address)) as Record<string, unknown>
      const snapshot = readProfileSnapshot(address)

      const serverXp = typeof restored?.xp === 'number' ? (restored.xp as number) : undefined
      const localXp = typeof snapshot?.xp === 'number' ? snapshot.xp : undefined
      // Prefer the higher XP to avoid propagating stale 0s from cold server state.
      const xpToSync =
        typeof localXp === 'number' && typeof serverXp === 'number'
          ? Math.max(localXp, serverXp)
          : (localXp ?? serverXp)

      // Keep local snapshot fresh.
      if (typeof serverXp === 'number' && serverXp > 0) {
        persistProfileSnapshot(address, { ...(snapshot || {}), wallet: address, xp: serverXp })
      }

      // IMPORTANT: never send xp: 0 unless we truly know it's 0,
      // otherwise we can overwrite real XP in the server store.
      const payload: Record<string, unknown> = {
        wallet: address,
        display_name: snapshot?.display_name,
        pfp_image: snapshot?.pfp_image ?? null,
        pfp_rarity: snapshot?.pfp_rarity ?? null,
        profile_bg_from: snapshot?.profile_bg_from,
        profile_bg_to: snapshot?.profile_bg_to,
        claimed_badges: snapshot?.claimed_badges ?? [],
      }
      if (typeof xpToSync === 'number') payload.xp = xpToSync

      await fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }
    const res = await fetch(`/api/leaderboard?t=${Date.now()}`, { cache: 'no-store' })
    const data = res.ok ? await res.json() : []
    setLeaderboard(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [address])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, REFETCH_MS)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  useEffect(() => {
    const onFocus = () => fetchLeaderboard()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchLeaderboard])

  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Leaderboard
          </h1>
          <p className="text-center text-slate-600 text-base sm:text-lg">
            Ranked by total XP · Synced with daily XP (updates automatically)
          </p>

          <div
            className="relative h-[420px] overflow-hidden rounded-3xl border-4 border-amber-800 shadow-xl"
            style={{
              backgroundImage: "url('/camp-hero.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
              <div className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'hero-card-shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>

          <div className="mx-auto max-w-2xl space-y-3">
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading…</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No entries yet. Equip a CapyCamp NFT and earn daily XP!</p>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.wallet}
                  className={`border-4 p-6 flex items-center gap-4 rounded-2xl ${player.rank <= 3 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-400 bg-white/80'}`}
                >
                  <div className="text-3xl font-bold">{MEDALS[player.rank] ?? '⭐'}</div>
                  {player.pfpImage && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={player.pfpImage} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-800 truncate">{displayName(player)}</h3>
                    <p className="text-sm text-gray-600">{player.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-yellow-600">#{player.rank}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
