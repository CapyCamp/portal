'use client'

import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { readProfileSnapshot, restoreProfileIfNeeded } from '@/lib/profile-local-storage'
import { applyXpClaimToSnapshot, xpClaimRequestBody, type XpClaimApiResponse } from '@/lib/xp-claim-client'

/**
 * When wallet is connected, attempt to claim daily holdings XP in the background
 * (if 24h+ since last claim; supports catch-up up to 14 days). No UI – XP bar reflects the result.
 * Sends local snapshot so claims still work when the serverless in-memory store is cold.
 */
export function AutoClaimXP() {
  const { address } = useAccount()
  useEffect(() => {
    if (!address) return

    const run = async () => {
      await restoreProfileIfNeeded(address)
      try {
        const res = await fetch('/api/xp/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(xpClaimRequestBody(address)),
        })
        const data = res.ok ? ((await res.json()) as XpClaimApiResponse) : null
        if (data) {
          applyXpClaimToSnapshot(address, data)
          const snap = readProfileSnapshot(address)
          if (snap && typeof snap.xp === 'number') {
            fetch('/api/profile/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet: address,
                xp: snap.xp,
                ...(typeof snap.last_claim === 'number' ? { last_claim: snap.last_claim } : {}),
              }),
            }).catch(() => {})
          }
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
        body: JSON.stringify(xpClaimRequestBody(address)),
      })
        .then(async (res) => {
          if (!res.ok) return
          const data = (await res.json()) as XpClaimApiResponse
          applyXpClaimToSnapshot(address, data)
          const snap = readProfileSnapshot(address)
          if (snap && typeof snap.xp === 'number') {
            fetch('/api/profile/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet: address,
                xp: snap.xp,
                ...(typeof snap.last_claim === 'number' ? { last_claim: snap.last_claim } : {}),
              }),
            }).catch(() => {})
          }
        })
        .catch(() => {})
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [address])

  return null
}
