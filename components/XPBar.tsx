'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { persistProfileSnapshot, readProfileSnapshot, restoreProfileIfNeeded } from '@/lib/profile-local-storage'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const CYCLE_SIZE = 1000

/** Format number with commas; fixed locale to avoid server/client hydration mismatch. */
function formatXp(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/**
 * Each cycle = 1000 XP. When user hits 1000, bar "refreshes" and shows badge 1.
 * Next target 2000, then 3000, etc. Badge = number of times refreshed = completed cycles.
 */
function getCycleProgress(xp: number): {
  cycleNumber: number
  nextTarget: number
  progressPercent: number
} {
  const cycleNumber = Math.floor(xp / CYCLE_SIZE)
  const nextTarget = (cycleNumber + 1) * CYCLE_SIZE
  const startOfCycle = cycleNumber * CYCLE_SIZE
  const progressPercent =
    nextTarget > startOfCycle
      ? Math.min(100, (100 * (xp - startOfCycle)) / (nextTarget - startOfCycle))
      : 0
  return { cycleNumber, nextTarget, progressPercent }
}

export function XPBar() {
  const { address } = useAccount()
  const [xp, setXp] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!address) {
      setXp(null)
      return
    }
    const snapshot = readProfileSnapshot(address)
    const fromStorage = typeof snapshot?.xp === 'number' ? snapshot.xp : null
    if (fromStorage !== null) setXp(fromStorage)

    let cancelled = false
    const fetchXp = async () => {
      const result = await restoreProfileIfNeeded(address)
      if (cancelled) return
      const serverXp = typeof (result as { xp?: number }).xp === 'number' ? (result as { xp: number }).xp : null
      const localSnapshot = readProfileSnapshot(address)
      const localXp = typeof localSnapshot?.xp === 'number' ? localSnapshot.xp : null
      const xpValue = Math.max(serverXp ?? 0, localXp ?? 0)
      if (!cancelled) {
        setXp(xpValue)
        if (xpValue > 0) {
          persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: xpValue })
        }
      }
    }
    void fetchXp()
    const t = window.setTimeout(() => void fetchXp(), 2000)
    const onFocus = () => void fetchXp()
    const onXpUpdated = () => {
      const snap = readProfileSnapshot(address)
      const v = typeof snap?.xp === 'number' ? snap.xp : null
      if (v != null) setXp(v)
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('capycamp-xp-updated', onXpUpdated)
    return () => {
      cancelled = true
      window.clearTimeout(t)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('capycamp-xp-updated', onXpUpdated)
    }
  }, [address])

  const displayXp = xp ?? 0
  const { cycleNumber, nextTarget, progressPercent } = getCycleProgress(displayXp)

  const barContent = (
    <>
      <Zap className="h-4 w-4 shrink-0 text-amber-500 sm:h-5 sm:w-5 md:h-6 md:w-6" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative w-24 sm:w-32 md:w-40">
          <div className="relative h-4 overflow-hidden rounded-full border-2 border-green-300 bg-white/60 sm:h-5 md:h-6">
            {cycleNumber > 0 && (
              <span
                className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm sm:left-2 sm:text-xs"
                aria-hidden
              >
                {cycleNumber}
              </span>
            )}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-green-500 via-emerald-400 to-green-500"
              initial={false}
              animate={{ width: `${Math.max(2, progressPercent)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
        <span className="whitespace-nowrap text-[10px] font-bold text-gray-700 sm:text-xs md:text-sm">
          {formatXp(nextTarget)}
        </span>
      </div>
    </>
  )

  const barClassName =
    'flex items-center gap-2 rounded-full border-2 border-green-300 bg-white/90 px-3 py-2 shadow-xl backdrop-blur-md transition-all hover:shadow-2xl sm:gap-3 sm:border-3 sm:px-6 sm:py-3'

  if (!mounted) {
    return (
      <div className={barClassName} role="img" aria-label="XP progress">
        {barContent}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${barClassName}`}
          aria-label="View XP total"
        >
          {barContent}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-auto min-w-[160px]">
        <div className="space-y-1 text-center">
          <p className="text-2xl font-bold tabular-nums text-green-700">
            {formatXp(displayXp)} XP
          </p>
          <p className="text-xs text-slate-600">
            Next at {formatXp(nextTarget)} XP
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
