'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { Gift, Flame, Sparkles, Clock } from 'lucide-react'
import { rarityLabel } from '@/lib/capycamp-rarity'
import type { RarityTier } from '@/lib/capycamp-rarity'
import { restoreProfileIfNeeded } from '@/lib/profile-local-storage'
import {
  applyXpClaimToSnapshot,
  rewardsStatusUrlForWallet,
  xpClaimRequestBody,
  type XpClaimApiResponse,
} from '@/lib/xp-claim-client'

type RewardsStatus = {
  address: string
  hasClaimedToday: boolean
  streak: number
  nextResetIso: string
  secondsUntilReset: number
  xpBoostPercent?: number
  camperPerkActive?: boolean
  equippedRarity?: RarityTier | null
  totalXp?: number
  lastClaim?: number
  nextDailyXpAt?: number
  secondsUntilDailyXp?: number
  /** Daily XP from holding CapyCamp NFTs (sum of XP per NFT per 24h) */
  xpPerDay?: number
  nftCount?: number
  /** Last holdings claim amount (for "Last claim: +X XP") */
  lastXpGained?: number | null
}

export function DailyRewardsCard() {
  const { address, isConnected } = useAccount()
  const [status, setStatus] = useState<RewardsStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastHoldingsClaim, setLastHoldingsClaim] = useState<number | null>(null)
  const [secondsUntilDailyXp, setSecondsUntilDailyXp] = useState<number | null>(null)

  const fetchStatus = async (addr: string) => {
    try {
      setLoading(true)
      setError(null)
      await restoreProfileIfNeeded(addr)
      const res = await fetch(rewardsStatusUrlForWallet(addr))
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load rewards status')
      }
      const data = (await res.json()) as RewardsStatus
      setStatus(data)
      setSecondsLeft(data.secondsUntilReset)
      setSecondsUntilDailyXp(data.secondsUntilDailyXp ?? null)
      if (data.lastXpGained != null && data.lastXpGained > 0) {
        setLastHoldingsClaim((prev) => prev ?? data.lastXpGained ?? null)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load rewards status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!address) {
      setStatus(null)
      setSecondsLeft(null)
      return
    }
    void fetchStatus(address)
  }, [address])

  useEffect(() => {
    if (secondsLeft == null) return
    if (secondsLeft <= 0) return

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null) return prev
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [secondsLeft])

  useEffect(() => {
    if (secondsUntilDailyXp == null) return
    if (secondsUntilDailyXp <= 0) return

    const id = setInterval(() => {
      setSecondsUntilDailyXp((prev) => {
        if (prev == null) return prev
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [secondsUntilDailyXp])

  const handleClaim = async () => {
    if (!address || !isConnected || claiming) return
    try {
      setClaiming(true)
      setError(null)
      const res = await fetch('/api/xp/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xpClaimRequestBody(address)),
      })
      const data = (await res.json()) as XpClaimApiResponse
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to claim')
      }
      applyXpClaimToSnapshot(address, data)
      if (data.claimed && typeof data.xpGained === 'number') {
        setLastHoldingsClaim(data.xpGained)
        setSecondsUntilDailyXp(data.nextClaimAt ? Math.max(0, Math.floor((data.nextClaimAt - Date.now()) / 1000)) : null)
        void fetchStatus(address)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to claim')
    } finally {
      setClaiming(false)
    }
  }

  const canClaimHoldings = Boolean(
    address &&
      isConnected &&
      status &&
      (secondsUntilDailyXp ?? status?.secondsUntilDailyXp ?? 0) <= 0 &&
      (status?.nftCount ?? 0) > 0 &&
      !loading &&
      !claiming,
  )

  const countdownText = useMemo(() => {
    const total = secondsLeft ?? status?.secondsUntilReset ?? 0
    if (!total || total <= 0) return 'Ready for next claim'
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [secondsLeft, status])

  const boost = status?.xpBoostPercent ?? 0
  const perkHint =
    boost === 0
      ? 'Equip a Rare, Epic, or Legendary CapyCamp avatar for +5% / +10% / +20% daily XP.'
      : `${rarityLabel(status?.equippedRarity ?? 'common')} camper: +${boost}% on today’s claim.`

  const xpPerDay = status?.xpPerDay ?? 0
  const nftCount = status?.nftCount ?? 0
  const dailyXpRarityHint =
    nftCount === 0
      ? 'Hold CapyCamp NFTs to earn daily XP (Rare +5, Epic +10, Legendary +20 each per day).'
      : `${nftCount} CapyCamp NFT${nftCount === 1 ? '' : 's'} → ${xpPerDay} XP/day`

  const dailyXpSeconds = secondsUntilDailyXp ?? status?.secondsUntilDailyXp ?? 0
  const dailyXpCountdown =
    dailyXpSeconds <= 0
      ? 'Ready to claim'
      : `${Math.floor(dailyXpSeconds / 3600)
          .toString()
          .padStart(2, '0')}:${Math.floor((dailyXpSeconds % 3600) / 60)
          .toString()
          .padStart(2, '0')}:${(dailyXpSeconds % 60).toString().padStart(2, '0')}`

  return (
    <section className="space-y-3 sm:space-y-4">
      <h2 className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:text-lg sm:tracking-[0.2em]">
        Daily Rewards
      </h2>

      <div className="flex flex-col gap-4 rounded-2xl border-3 border-amber-300 bg-amber-50/90 p-4 shadow-[0_14px_30px_rgba(245,158,11,0.35)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-1 min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-[0_10px_20px_rgba(180,83,9,0.6)] sm:h-14 sm:w-14">
            <Gift className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Campfire Daily Cookie
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-sm">
                <Flame className="h-3 w-3 text-amber-500" />
                Streak:{' '}
                <span className="font-bold">
                  {status?.streak ?? 0} day{(status?.streak ?? 0) === 1 ? '' : 's'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 shadow-sm">
                Next reset: <span className="font-mono">{countdownText}</span>
              </span>
            </div>
            <div className="mt-1 flex items-start gap-1.5 rounded-lg border border-amber-200/80 bg-white/70 px-2 py-1.5 text-[11px] text-amber-900">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{perkHint}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>{dailyXpRarityHint}</span>
              <span className="ml-auto font-mono font-medium text-slate-600">{dailyXpCountdown}</span>
            </div>
            {(lastHoldingsClaim !== null || (status?.lastXpGained != null && status.lastXpGained > 0)) && (
              <div className="mt-1 text-[11px] font-semibold text-emerald-800">
                Last claim: +{lastHoldingsClaim ?? status?.lastXpGained ?? 0} XP
              </div>
            )}
            {error && (
              <div className="mt-1 text-[11px] text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:w-44">
          <button
            type="button"
            onClick={handleClaim}
            disabled={!canClaimHoldings}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 via-orange-400 to-amber-500 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 shadow-[0_14px_30px_rgba(146,64,14,0.9)] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(146,64,14,1)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claiming
              ? 'Claiming...'
              : !isConnected
                ? 'Connect Wallet'
                : (status?.nftCount ?? 0) === 0
                  ? 'No NFTs'
                  : dailyXpSeconds > 0
                    ? 'Already Claimed'
                    : 'Claim XP'}
          </button>

          <div className="h-10 rounded-xl border-2 border-dashed border-amber-300 bg-amber-100/60 text-center text-[10px] font-medium text-amber-800 flex items-center justify-center px-1">
            Hold NFTs: Rare +5 · Epic +10 · Legendary +20 XP each/day
          </div>
        </div>
      </div>
    </section>
  )
}
