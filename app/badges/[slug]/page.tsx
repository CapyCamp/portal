'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { BADGES } from '@/lib/badges'
import { Award, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

type BadgeStatusResponse = {
  address: string
  streak: number
  badges: {
    slug: string
    earned: boolean
  }[]
}

export default function BadgeDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const badge = BADGES.find((b) => b.slug === slug)
  const { address, isConnected } = useAccount()
  const BADGES_COMING_SOON = true
  const [earned, setEarned] = useState<boolean | null>(null)

  useEffect(() => {
    if (!address || !badge) {
      setEarned(null)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/badges/status?address=${encodeURIComponent(address)}`)
        if (!res.ok) return
        const data = (await res.json()) as BadgeStatusResponse
        const match = data.badges.find((b) => b.slug === badge.slug)
        if (!cancelled && match) {
          setEarned(match.earned)
        }
      } catch {
        // ignore
      }
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [address, badge])

  if (BADGES_COMING_SOON) {
    return (
      <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-16">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-8 py-12 text-center opacity-70 grayscale">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80">
            <Award className="h-8 w-8 text-slate-500" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-600 sm:text-2xl">
            Badges are being fixed
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Coming soon</p>
          <p className="text-sm text-slate-500">
            Badge claiming and eligibility logic are temporarily disabled while we resolve the current issues.
            Check back shortly.
          </p>
          <p className="text-xs text-slate-500">
            {isConnected ? 'Your badge updates will show once maintenance is complete.' : 'Connect a wallet later to view badges.'}
          </p>
        </div>
      </div>
    )
  }

  if (!badge) {
    return (
      <div className="w-full min-h-full px-4 py-8 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Link
            href="/badges"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Badges
          </Link>
          <p className="text-sm text-slate-700">Badge not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full px-4 py-8 pb-24 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/badges"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Badges
        </Link>

        <div className="rounded-3xl border-4 border-amber-300 bg-linear-to-br from-amber-50/90 via-sky-50/80 to-emerald-50/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.3)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-amber-400 bg-white shadow-[0_16px_36px_rgba(180,83,9,0.7)] sm:h-32 sm:w-32">
              {badge.image ? (
                <Image src={badge.image} alt={badge.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-400 to-emerald-400">
                  <Award className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {badge.name}
              </h1>
              <p className="text-sm text-slate-700 sm:text-base">{badge.description}</p>

              <div className="mt-2 rounded-2xl bg-white/80 p-3 text-xs text-slate-800 shadow-inner sm:text-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  How to Obtain
                </div>
                <p>{badge.criteria}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/80 px-3 py-1 font-medium text-slate-800">
                  Status:
                  <span
                    className={
                      earned
                        ? 'rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'
                        : 'rounded-full bg-slate-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800'
                    }
                  >
                    {earned ? 'Earned' : 'Locked'}
                  </span>
                </span>
                {!isConnected && (
                  <span className="text-[11px] text-slate-600">
                    Connect your wallet on the Profile page to track this badge.
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                In the future, this badge may be mintable onchain as an NFT or SBT.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

