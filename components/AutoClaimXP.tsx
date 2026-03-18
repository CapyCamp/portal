'use client'

import { useAccount } from 'wagmi'
import { useEffect, useRef } from 'react'
import { persistProfileSnapshot, readProfileSnapshot, restoreProfileIfNeeded } from '@/lib/profile-local-storage'

/**
 * When wallet is connected, attempt to claim daily holdings XP in the background
 * (if 24h cooldown has passed). No UI – XP bar and profile reflect the result.
 */
export function AutoClaimXP() {
  const { address } = useAccount()
  const didClaimRef = useRef(false)

  useEffect(() => {
    if (!address) return

    const run = async () => {
      await restoreProfileIfNeeded(address)
      try {
        const res = await fetch('/api/xp/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address }),
        })
        const data = res.ok ? await res.json() : null
        if (data?.claimed) didClaimRef.current = true
        if (typeof data?.totalXp === 'number') {
          persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), wallet: address, xp: data.totalXp })
        }
      } catch {
        // silent
      }
    }

    void run()
  }, [address])

  useEffect(() => {
    if (!address) return

    const onFocus = () => {
      fetch('/api/xp/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      }).catch(() => {})
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [address])

  return null
}
