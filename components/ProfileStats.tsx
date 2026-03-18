'use client'

import { useAccount, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import { Zap, Trophy, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { persistProfileSnapshot, readProfileSnapshot, restoreProfileIfNeeded } from '@/lib/profile-local-storage'

const STREAK_CLAIM_MESSAGE_PREFIX = 'CapyCamp Daily Streak Claim\nDate: '

export function ProfileStats() {
  const { address, isConnected } = useAccount()
  const [totalXp, setTotalXp] = useState<number | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [hasClaimedToday, setHasClaimedToday] = useState(false)
  const [xpJustClaimed, setXpJustClaimed] = useState<number>(0)
  const [streakClaiming, setStreakClaiming] = useState(false)
  const [streakError, setStreakError] = useState<string | null>(null)

  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    if (!address) {
      setTotalXp(null)
      setStreak(0)
      return
    }

    let cancelled = false

    const run = async () => {
      await restoreProfileIfNeeded(address)

      const [statusRes, rewardsRes] = await Promise.all([
        fetch(`/api/profile/status?address=${encodeURIComponent(address)}`),
        fetch(`/api/rewards/status?address=${encodeURIComponent(address)}`),
      ])

      if (cancelled) return

      const profile = statusRes.ok ? await statusRes.json() : {}
      const rewards = rewardsRes.ok ? await rewardsRes.json() : {}

      const xpFromProfile = typeof profile.xp === 'number' ? profile.xp : 0
      setTotalXp(xpFromProfile)
      setStreak(rewards.streak ?? 0)
      setHasClaimedToday(rewards.hasClaimedToday ?? false)
      if (xpFromProfile > 0) {
        persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: xpFromProfile })
      }

      const claimRes = await fetch('/api/xp/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      })
      const claimData = claimRes.ok ? await claimRes.json() : {}

      if (cancelled) return

      if (claimData.claimed && typeof claimData.xpGained === 'number') {
        const newTotal = claimData.totalXp ?? 0
        setTotalXp(newTotal)
        setXpJustClaimed(claimData.xpGained)
        persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: newTotal })
        window.setTimeout(() => setXpJustClaimed(0), 2500)
      } else if (typeof claimData.totalXp === 'number') {
        setTotalXp(claimData.totalXp)
        persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: claimData.totalXp })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [address])

  const handleStreakClaim = async () => {
    if (!address || !isConnected || streakClaiming || hasClaimedToday) return
    setStreakError(null)
    setStreakClaiming(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const message = `${STREAK_CLAIM_MESSAGE_PREFIX}${today}`
      const signature = await signMessageAsync({ message })
      const res = await fetch('/api/streak/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStreakError(data?.error ?? 'Claim failed')
        return
      }
      setStreak(data.streak ?? streak)
      setTotalXp(data.totalXp ?? totalXp ?? 0)
      setHasClaimedToday(true)
      if (typeof data.xpGranted === 'number') {
        setXpJustClaimed(data.xpGranted)
        window.setTimeout(() => setXpJustClaimed(0), 2500)
      }
      if (data.totalXp != null) {
        persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: data.totalXp })
      }
    } catch (e) {
      setStreakError(e instanceof Error ? e.message : 'Claim failed')
    } finally {
      setStreakClaiming(false)
    }
  }

  const stats = [
    {
      icon: Zap,
      label: 'Daily Login Streak',
      value: streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : '—',
      borderClass: 'border-amber-400',
      bgClass: 'bg-amber-50/90',
      iconClass: 'text-amber-600',
      isStreakCard: true,
    },
    {
      icon: Trophy,
      label: 'Total XP',
      isStreakCard: false,
      value: totalXp !== null ? totalXp.toLocaleString() : '—',
      borderClass: 'border-blue-400',
      bgClass: 'bg-blue-50/90',
      iconClass: 'text-blue-600',
      badge: xpJustClaimed > 0 ? `+${xpJustClaimed} XP` : null,
    },
    {
      icon: Award,
      label: 'Badges Earned',
      value: '12',
      borderClass: 'border-emerald-400',
      bgClass: 'bg-emerald-50/90',
      iconClass: 'text-emerald-600',
    },
  ] as const

  return (
    <section className="space-y-3 sm:space-y-4">
      <h2 className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:text-lg sm:tracking-[0.2em]">
        Camp Stats
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const isStreak = 'isStreakCard' in stat && stat.isStreakCard
          return (
            <div
              key={i}
              className={`relative flex flex-col gap-1 rounded-xl border-3 ${stat.borderClass} ${stat.bgClass} p-4 shadow-[0_10px_24px_rgba(15,23,42,0.2)]`}
            >
              {stat.badge && (
                <div className="absolute -top-1 -right-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                  {stat.badge}
                </div>
              )}
              <Icon className={`mb-1 h-5 w-5 ${stat.iconClass}`} />
              <div className="text-sm font-semibold text-slate-800 sm:text-base">
                {stat.value}
              </div>
              <div className="text-xs text-slate-600">{stat.label}</div>
              {isStreak && (
                <div className="mt-2 flex flex-col gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200"
                    onClick={() => void handleStreakClaim()}
                    disabled={!isConnected || hasClaimedToday || streakClaiming}
                  >
                    {streakClaiming ? 'Sign & claim…' : hasClaimedToday ? 'Claimed today' : 'Claim 10 XP'}
                  </Button>
                  {streakError && (
                    <p className="text-[10px] text-red-600">{streakError}</p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    7th day in a row = +50 XP bonus
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
