'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import type { BadgeDefinition } from '@/lib/badges'
import { Award } from 'lucide-react'

type BadgeWithStatus = BadgeDefinition & { earned: boolean }

type BadgesResponse = {
  address: string
  streak: number
  badges: BadgeWithStatus[]
}

export function BadgeCabinet() {
  const { address, isConnected } = useAccount()
  const [data, setData] = useState<BadgesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/badges/status?address=${encodeURIComponent(address)}`)
        const body = await res.json()
        if (!res.ok) {
          throw new Error(body?.error || 'Failed to load badges')
        }
        if (!cancelled) {
          setData(body)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to load badges')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [address])

  const earnedBadges = data?.badges.filter((b) => b.earned) ?? []
  const lockedBadges = data?.badges.filter((b) => !b.earned) ?? []

  return (
    <section className="space-y-3 sm:space-y-4">
      <h2 className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:text-lg sm:tracking-[0.2em]">
        Badge Cabinet
      </h2>

      <div className="space-y-4 rounded-2xl border-3 border-amber-200 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.3)] sm:p-5">
        <p className="text-xs text-slate-700 sm:text-sm">
          Badges are tied to your wallet. Earn them through NFTs, daily streaks, and community
          events. Click any badge to view its details.
        </p>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {!isConnected && (
          <p className="text-xs text-slate-600 sm:text-sm">
            Connect your Abstract wallet to see which badges you have unlocked.
          </p>
        )}

        {loading && (
          <p className="text-xs text-slate-600 sm:text-sm">
            Loading badge cabinet...
          </p>
        )}

        {/* Earned badges */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:text-sm">
            Earned Badges
          </h3>
          {earnedBadges.length === 0 ? (
            <p className="text-xs text-slate-500 sm:text-sm">
              No badges earned yet. Start claiming daily rewards and joining the camp to unlock
              them.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
              {earnedBadges.map((badge) => (
                <Link
                  key={badge.slug}
                  href={`/badges/${badge.slug}`}
                  className="group flex flex-col items-center gap-1 rounded-xl border-2 border-emerald-300 bg-emerald-50/80 p-2 text-center shadow-sm outline-none transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-emerald-400 bg-white shadow-[0_6px_14px_rgba(16,185,129,0.5)] sm:h-14 sm:w-14">
                    {badge.image ? (
                      <Image
                        src={badge.image}
                        alt={badge.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-400 to-sky-400">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="line-clamp-2 text-[10px] font-semibold text-slate-800 sm:text-xs">
                    {badge.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Locked badges */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-sm">
            Locked Badges
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
            {(lockedBadges.length ? lockedBadges : data?.badges ?? []).map((badge) => (
              <Link
                key={badge.slug}
                href={`/badges/${badge.slug}`}
                className="group flex flex-col items-center gap-1 rounded-xl border-2 border-slate-300/80 bg-slate-100/80 p-2 text-center shadow-inner outline-none transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-slate-300 bg-slate-200/90 sm:h-14 sm:w-14">
                  {badge.image ? (
                    <div className="relative h-full w-full opacity-40 grayscale">
                      <Image
                        src={badge.image}
                        alt={badge.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-300/80">
                      <Award className="h-6 w-6 text-slate-500" />
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 text-[10px] font-semibold text-slate-500 sm:text-xs">
                  {badge.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

