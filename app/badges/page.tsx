'use client'

import Image from 'next/image'
import { Award, Lock, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { BADGES } from '@/lib/badges'
import { Button } from '@/components/ui/button'
import { useWalletClient } from 'wagmi'
import { toHex } from 'viem'
import { usePublicClient } from 'wagmi'
import { persistProfileSnapshot, readProfileSnapshot } from '@/lib/profile-local-storage'

const BADGE_COUNT = 33

const BADGE_CARD_STYLES: { bg: string; border: string; ring: string; icon: string; label: string }[] = [
  { bg: 'bg-sky-50/85', border: 'border-sky-300/80', ring: 'group-hover:ring-sky-300/60', icon: 'text-sky-700', label: 'text-sky-900' },
  { bg: 'bg-amber-50/85', border: 'border-amber-300/80', ring: 'group-hover:ring-amber-300/60', icon: 'text-amber-700', label: 'text-amber-900' },
  { bg: 'bg-emerald-50/85', border: 'border-emerald-300/80', ring: 'group-hover:ring-emerald-300/60', icon: 'text-emerald-700', label: 'text-emerald-900' },
  { bg: 'bg-violet-50/85', border: 'border-violet-300/80', ring: 'group-hover:ring-violet-300/60', icon: 'text-violet-700', label: 'text-violet-900' },
  { bg: 'bg-rose-50/85', border: 'border-rose-300/80', ring: 'group-hover:ring-rose-300/60', icon: 'text-rose-700', label: 'text-rose-900' },
  { bg: 'bg-lime-50/85', border: 'border-lime-300/80', ring: 'group-hover:ring-lime-300/60', icon: 'text-lime-700', label: 'text-lime-900' },
  { bg: 'bg-cyan-50/85', border: 'border-cyan-300/80', ring: 'group-hover:ring-cyan-300/60', icon: 'text-cyan-700', label: 'text-cyan-900' },
  { bg: 'bg-orange-50/85', border: 'border-orange-300/80', ring: 'group-hover:ring-orange-300/60', icon: 'text-orange-700', label: 'text-orange-900' },
]

function badgeStyle(index: number) {
  return BADGE_CARD_STYLES[index % BADGE_CARD_STYLES.length]!
}

const BADGE_IMAGES: Record<number, string> = {
  0: '/badges/firstdayatcamp.png',
  1: '/badges/navigator.png',
}

// Placeholder "how to obtain" text per badge (cycle or use index)
const OBTAIN_MESSAGES: string[] = [
  'Join the CapyCamp Discord and complete verification.',
  'Attend your first campfire story session.',
  'Complete the Scout Oath in Lore.',
  'Enter a raffle in the Shop using Cookies.',
  'Reach 7 days of active participation in the camp.',
  'Unlock by completing a seasonal challenge.',
  'Earned by contributing to the camp community.',
  'Awarded for completing the Mystery Forest chapter.',
  'Unlock when you collect your first Camp merch.',
  'Earn through DRIP.re Cookie milestones.',
  'Granted to early CapyCamp supporters.',
  'Complete all 5 Lore chapters.',
  'Earned by climbing the Leaderboard top 10.',
  'Awarded at special camp events (IRL or digital).',
  'Unlock by earning 10 other badges.',
  'Granted for consistent weekly activity.',
  'Earned by referring a new Scout to the camp.',
  'Awarded for completing the Elder??? trial.',
  'Unlock by participating in a limited raffle.',
  'Earned through Discord role milestones.',
  'Granted to Counselors and community helpers.',
  'Unlock when the Great Glampening launches.',
  'Earned by collecting a full badge set category.',
  'Awarded for creative camp contributions.',
  'Unlock by holding a CapyCamp NFT.',
  'Earned by completing the Camp Opens chapter.',
  'Granted at random during campfire events.',
  'Unlock by spending Cookies in the Shop.',
  'Earned by reaching 30 days in the camp.',
  'Awarded for top Leaderboard placement.',
  'Unlock through a future camp storyline.',
  'Earned by participating in beta or tests.',
  'Granted for long-term camp membership.',
  'Complete all 33 badges to unlock this final badge.',
]

function getObtainMessage(index: number): string {
  return OBTAIN_MESSAGES[index % OBTAIN_MESSAGES.length] ?? OBTAIN_MESSAGES[0]
}

type BadgeStatusResponse = {
  address: string
  streak: number
  badges: { slug: string; earned: boolean; claimed?: boolean }[]
}

export default function BadgesPage() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null)
  const [earned, setEarned] = useState<boolean[]>(() => Array.from({ length: BADGE_COUNT }, () => false))
  const [claimed, setClaimed] = useState<boolean[]>(() => Array.from({ length: BADGE_COUNT }, () => false))
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimStatus, setClaimStatus] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setEarned(Array.from({ length: BADGE_COUNT }, () => false))
      setClaimed(Array.from({ length: BADGE_COUNT }, () => false))
      return
    }
    // Sync claimed badges from local snapshot into server store (survives cold starts).
    const snap = readProfileSnapshot(address)
    if (snap?.claimed_badges?.length) {
      // Immediately reflect local claimed badges in UI (don’t wait on server).
      const bySlug = new Set(snap.claimed_badges)
      setClaimed(Array.from({ length: BADGE_COUNT }, (_, i) => bySlug.has(BADGES[i]?.slug ?? '')))
    }
    if (snap) {
      fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          claimed_badges: snap.claimed_badges ?? [],
        }),
      }).catch(() => {})
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/badges/status?address=${encodeURIComponent(address)}&t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as BadgeStatusResponse
        const nextEarned = Array.from({ length: BADGE_COUNT }, (_, i) => Boolean(data.badges?.[i]?.earned))
        const localSlugs = new Set(readProfileSnapshot(address)?.claimed_badges ?? [])
        const nextClaimed = Array.from(
          { length: BADGE_COUNT },
          (_, i) => Boolean(data.badges?.[i]?.claimed) || localSlugs.has(BADGES[i]?.slug ?? ''),
        )
        if (!cancelled) {
          setEarned(nextEarned)
          setClaimed(nextClaimed)
        }
      } catch {
        // ignore
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [address])

  // Sequential unlock: badge #1 always unlocked. If badge N is CLAIMED, badge N+1 unlocks.
  const unlockedCount = useMemo(() => {
    let unlocked = 1
    while (unlocked < BADGE_COUNT && claimed[unlocked - 1]) unlocked += 1
    return unlocked
  }, [claimed])

  const selected = selectedBadge !== null ? BADGES[selectedBadge] : null
  const selectedEarned = selectedBadge !== null ? Boolean(earned[selectedBadge]) : false
  const selectedClaimed = selectedBadge !== null ? Boolean(claimed[selectedBadge]) : false
  const selectedUnlocked = selectedBadge !== null ? selectedBadge < unlockedCount : false

  const handleClaim = async () => {
    if (selectedBadge === null || !selected || !address) return
    if (!selectedUnlocked || !selectedEarned || selectedClaimed) return
    if (!walletClient) {
      setClaimError('Wallet not ready')
      return
    }
    if (!publicClient) {
      setClaimError('Network client not ready')
      return
    }
    setClaimError(null)
    setClaimStatus(null)
    setLastTxHash(null)
    setClaiming(true)
    try {
      // Real on-chain tx: send a 0-value tx to self with a memo-like data payload.
      const data = toHex(`CapyCamp Badge Claim: ${selected.slug}`)
      const txHash = await walletClient.sendTransaction({
        account: address as `0x${string}`,
        to: address as `0x${string}`,
        value: 0n,
        data,
      })
      setLastTxHash(txHash)
      setClaimStatus('Waiting for confirmation…')

      // Poll the server claim endpoint until tx is mined & verified.
      // This avoids hanging UIs when receipt waiting is flaky.
      const startedAt = Date.now()
      const timeoutMs = 90_000
      let claimedOk = false
      while (Date.now() - startedAt < timeoutMs) {
        const res = await fetch('/api/badges/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, slug: selected.slug, txHash }),
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok) {
          claimedOk = true
          break
        }
        // 409 means not mined yet; keep waiting.
        if (res.status !== 409) {
          setClaimError(
            (json?.error ? String(json.error) : 'Claim failed') +
              (txHash ? ` (tx: ${String(txHash).slice(0, 10)}…)` : ''),
          )
          return
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
      if (!claimedOk) {
        setClaimError(`Still pending confirmation (tx: ${String(txHash).slice(0, 10)}…)`)
        return
      }
      setClaimStatus('Claimed!')

      // Persist claimed badge locally so it survives server restarts.
      const prev = readProfileSnapshot(address)?.claimed_badges ?? []
      if (!prev.includes(selected.slug)) {
        persistProfileSnapshot(address, { claimed_badges: [...prev, selected.slug] })
      }
      // Reflect immediately in UI.
      setClaimed((prevArr) => {
        const next = [...prevArr]
        next[selectedBadge] = true
        return next
      })
      // Sync to server profile store immediately (so status API can reflect it right away).
      fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, claimed_badges: [...prev, selected.slug] }),
      }).catch(() => {})

      // Refresh status
      const statusRes = await fetch(`/api/badges/status?address=${encodeURIComponent(address)}&t=${Date.now()}`, { cache: 'no-store' })
      const status = statusRes.ok ? ((await statusRes.json()) as BadgeStatusResponse) : null
      if (status) {
        setEarned(Array.from({ length: BADGE_COUNT }, (_, i) => Boolean(status.badges?.[i]?.earned)))
        const localSlugs = new Set(readProfileSnapshot(address)?.claimed_badges ?? [])
        setClaimed(Array.from({ length: BADGE_COUNT }, (_, i) => Boolean(status.badges?.[i]?.claimed) || localSlugs.has(BADGES[i]?.slug ?? '')))
      }
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'Claim failed')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Badges
          </h1>
          <p className="text-center text-slate-600 text-sm sm:text-base">
            {BADGE_COUNT} badges to earn. Complete challenges, join the camp, and unlock them
            over time.
          </p>

          <div className="mx-auto max-w-4xl space-y-8">
        {/* Badge grid - silhouettes */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: BADGE_COUNT }, (_, i) => (
            (() => {
              const s = badgeStyle(i)
              const isUnlocked = i < unlockedCount
              const isEarned = Boolean(earned[i])
              const isClaimed = Boolean(claimed[i])
              return (
            <button
              key={i}
              type="button"
              onClick={() => isUnlocked && setSelectedBadge(i)}
              disabled={!isUnlocked}
              className={[
                'group relative flex flex-col items-center gap-3 rounded-3xl border-3 p-5 text-left outline-none shadow-[0_14px_34px_rgba(15,23,42,0.18)] backdrop-blur-sm transition',
                isUnlocked
                  ? 'hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.22)]'
                  : 'cursor-not-allowed opacity-60 grayscale',
                'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/60',
                s.bg,
                s.border,
              ].join(' ')}
              title={
                isUnlocked
                  ? `${BADGES[i]?.name ?? `Badge ${i + 1}`} — ${isClaimed ? 'Claimed' : isEarned ? 'Eligible' : 'Unlocked'}`
                  : `Badge ${i + 1} — Locked (earn Badge ${i} first)`
              }
            >
              <div
                className={[
                  'relative flex h-20 w-20 items-center justify-center rounded-full border-3 bg-white/85 shadow-inner transition-all',
                  isUnlocked ? 'group-hover:scale-[1.04] group-hover:bg-white/90' : '',
                  isUnlocked ? 'ring-0 group-hover:ring-4' : '',
                  s.border,
                  isUnlocked ? s.ring : '',
                ].join(' ')}
              >
                {BADGE_IMAGES[i] && (isUnlocked || isEarned) ? (
                  <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full">
                    <Image
                      src={BADGE_IMAGES[i] as string}
                      alt={`Badge ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>
                ) : (
                  <Award className={['h-10 w-10', s.icon].join(' ')} strokeWidth={1.5} />
                )}
              </div>

              <div className="w-full min-w-0 space-y-0.5 text-center">
                <div className={['text-base font-extrabold tracking-tight', s.label].join(' ')}>
                  {BADGES[i]?.name ?? `Badge ${i + 1}`}
                </div>
                <div className="text-xs font-semibold text-slate-600/90">
                  {isUnlocked ? (isClaimed ? 'Claimed' : isEarned ? 'Claim now' : 'Tap to view') : 'Locked'}
                </div>
              </div>

              {!isUnlocked && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
                  <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                    <Lock className="h-4 w-4" />
                    Locked
                  </div>
                </div>
              )}
            </button>
              )
            })()
          ))}
        </section>

        {/* Legend / CTA */}
        <section className="rounded-2xl border-4 border-amber-300 bg-linear-to-br from-amber-50/90 via-sky-50/70 to-emerald-50/80 p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.2)] text-center">
          <p className="text-slate-700 text-sm sm:text-base">
            Badges are earned through camp activities, Discord, and special events. Check back
            as we reveal each one.
          </p>
        </section>
          </div>
        </div>
      </section>

      {/* Badge detail card (modal) */}
      {selectedBadge !== null && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden
            onClick={() => setSelectedBadge(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-amber-300 bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
              {/* Left: badge bigger */}
              <div className="flex shrink-0 justify-center sm:justify-start">
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-slate-300 bg-slate-200/80 shadow-inner">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden">
                    {BADGES[selectedBadge]?.image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={BADGES[selectedBadge]?.image ?? ''}
                          alt={BADGES[selectedBadge]?.name ?? `Badge ${(selectedBadge ?? 0) + 1}`}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                    ) : (
                      <Award
                        className="h-12 w-12 sm:h-14 sm:w-14 text-slate-500/70"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* Right: how to obtain */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                  {BADGES[selectedBadge]?.name ?? `Badge ${selectedBadge + 1}`}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(null)}
                    className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
                  How to obtain
                </p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {selectedBadge + 1 > unlockedCount
                    ? `Locked — earn Badge ${selectedBadge} first to unlock this one.`
                    : (BADGES[selectedBadge]?.criteria ?? getObtainMessage(selectedBadge))}
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/80 px-3 py-1 font-medium text-slate-800">
                      Status:
                      <span
                        className={
                          selectedClaimed
                            ? 'rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'
                            : selectedEarned
                              ? 'rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'
                              : 'rounded-full bg-slate-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800'
                        }
                      >
                        {selectedClaimed ? 'Claimed' : selectedEarned ? 'Eligible' : 'Locked'}
                      </span>
                    </span>
                  </div>

                  {selectedUnlocked && selectedEarned && !selectedClaimed && (
                    <Button
                      type="button"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={!address || claiming}
                      onClick={() => void handleClaim()}
                    >
                      {claiming ? 'Claiming…' : 'Claim badge (Abstract tx)'}
                    </Button>
                  )}
                  {claimStatus && (
                    <p className="text-xs text-slate-600">{claimStatus}</p>
                  )}
                  {lastTxHash && (
                    <p className="text-[11px] text-slate-500">
                      Tx: <span className="font-mono">{lastTxHash.slice(0, 10)}…{lastTxHash.slice(-6)}</span>
                    </p>
                  )}
                  {claimError && <p className="text-xs text-red-600">{claimError}</p>}
                  {selectedClaimed && (
                    <p className="text-xs text-slate-600">
                      This badge is claimed and yours to keep.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
