'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'
import { useAccount, useBalance, useSignMessage } from 'wagmi'
import { Zap, Award, Pencil, Palette, ImageIcon, Check, X, Trophy } from 'lucide-react'
import {
  rarityGlowClass,
  rarityLabel,
  RARITY_BADGE_CLASSES,
} from '@/lib/capycamp-rarity'
import type { RarityTier } from '@/lib/capycamp-rarity'
import {
  DEFAULT_PROFILE_BG_FROM,
  DEFAULT_PROFILE_BG_TO,
} from '@/lib/profile-defaults'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CapyNft } from '@/hooks/useCapyNFTs'
import {
  persistProfileSnapshot,
  readProfileSnapshot,
  restoreProfileIfNeeded,
  type PersistedProfile,
} from '@/lib/profile-local-storage'
import { BADGES } from '@/lib/badges'

type AbstractPortalProfile = {
  user?: {
    name?: string
    tier?: number
    pfpUrl?: string
    avatarUrl?: string
    avatar?: string
    badges?: { id?: string; name?: string; claimed?: boolean }[]
  }
}

type ProfileStatus = {
  wallet: string
  display_name?: string
  profile_bg_from?: string
  profile_bg_to?: string
  pfp_image?: string | null
  pfp_token_id?: string | null
  pfp_contract?: string | null
  pfp_rarity?: RarityTier
  pfp_power_level?: number
  xp_boost_percent?: number
}

const BG_PRESETS: { label: string; from: string; to: string }[] = [
  { label: 'Sky camp', from: '#bfdbfe', to: '#e9d5ff' },
  { label: 'Forest', from: '#a7f3d0', to: '#6ee7b7' },
  { label: 'Sunset', from: '#fed7aa', to: '#fda4af' },
  { label: 'Lavender', from: '#ddd6fe', to: '#fbcfe8' },
  { label: 'Ocean', from: '#a5f3fc', to: '#93c5fd' },
  { label: 'Ember', from: '#fde68a', to: '#fdba74' },
]

function friendlyStreakError(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  const msg = raw.toLowerCase()

  // Wallet / user behavior: Metamask/Wagmi often throws these when user cancels.
  if (msg.includes('rejected') || msg.includes('user rejected')) {
    return 'Signature rejected. No XP awarded.'
  }

  // Server-side verification failures.
  if (msg.includes('invalid signature')) {
    return 'Invalid signature. Please try again.'
  }

  if (msg.includes('signature required')) {
    return 'Please sign the streak message in your wallet.'
  }

  if (msg.includes('already claimed today')) {
    return 'Already claimed today.'
  }

  return raw || 'Claim failed'
}

export function ProfileCard() {
  const { address, isConnecting, isConnected } = useAccount()
  const loginState = useLoginWithAbstract()
  const isAuthLoading = 'isLoading' in loginState ? loginState.isLoading : false
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  } as { address?: `0x${string}`; query?: { enabled?: boolean } })

  const [portalProfile, setPortalProfile] = useState<AbstractPortalProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null)

  const [nameDraft, setNameDraft] = useState('')
  const [bgFromDraft, setBgFromDraft] = useState(DEFAULT_PROFILE_BG_FROM)
  const [bgToDraft, setBgToDraft] = useState(DEFAULT_PROFILE_BG_TO)
  const [savingSettings, setSavingSettings] = useState(false)
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false)
  const [nfts, setNfts] = useState<CapyNft[]>([])
  const [nftsLoading, setNftsLoading] = useState(false)
  const [settingPfpId, setSettingPfpId] = useState<string | null>(null)
  const [selectedPfpNft, setSelectedPfpNft] = useState<CapyNft | null>(null)
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  const [totalXp, setTotalXp] = useState<number | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [hasClaimedToday, setHasClaimedToday] = useState(false)
  const [xpJustClaimed, setXpJustClaimed] = useState<number>(0)
  const [streakClaiming, setStreakClaiming] = useState(false)
  const [streakError, setStreakError] = useState<string | null>(null)

  const { signMessageAsync } = useSignMessage()

  const loadProfileStatus = useCallback(async () => {
    if (!address) return
    const local = readProfileSnapshot(address) || {}
    const data = (await restoreProfileIfNeeded(address)) as Record<string, unknown>
    const merged = { ...local, wallet: address.toLowerCase() } as Record<string, unknown>
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null) merged[k] = v
    }
    const status = merged as ProfileStatus
    setProfileStatus(status)
    setNameDraft(status.display_name ?? '')
    setBgFromDraft(status.profile_bg_from ?? DEFAULT_PROFILE_BG_FROM)
    setBgToDraft(status.profile_bg_to ?? DEFAULT_PROFILE_BG_TO)
  }, [address])

  useEffect(() => {
    if (!address) {
      setPortalProfile(null)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        setIsProfileLoading(true)
        const res = await fetch(`/api/abstract/profile/${address}`)
        const data = (await res.json().catch(() => null)) as AbstractPortalProfile | null
        if (!cancelled && data && typeof data === 'object') {
          setPortalProfile(data)
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsProfileLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [address])

  useEffect(() => {
    if (!address) {
      setProfileStatus(null)
      setEditProfileOpen(false)
      return
    }
    const local = readProfileSnapshot(address)
    if (local && Object.keys(local).length > 1) {
      setProfileStatus({ ...local, wallet: address.toLowerCase() } as ProfileStatus)
      setNameDraft(local.display_name ?? '')
      setBgFromDraft(local.profile_bg_from ?? DEFAULT_PROFILE_BG_FROM)
      setBgToDraft(local.profile_bg_to ?? DEFAULT_PROFILE_BG_TO)
    }
    void loadProfileStatus()
  }, [address, loadProfileStatus])

  useEffect(() => {
    if (!isConnected) setEditProfileOpen(false)
  }, [isConnected])

  useEffect(() => {
    if (!address) {
      setTotalXp(null)
      setStreak(0)
      setHasClaimedToday(false)
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
    return () => { cancelled = true }
  }, [address])

  const handleStreakClaim = async () => {
    if (!address || !isConnected || streakClaiming || hasClaimedToday) return
    setStreakError(null)
    setStreakClaiming(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const message = `CapyCamp Daily Streak Claim\nDate: ${today}`
      const signature = await signMessageAsync({ message })
      const res = await fetch('/api/streak/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStreakError(friendlyStreakError(data?.error))
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
      setProfileStatus((prev) => (prev ? { ...prev, xp: data.totalXp } : prev))
    } catch (e) {
      setStreakError(friendlyStreakError(e))
    } finally {
      setStreakClaiming(false)
    }
  }

  const loadNftsForPfp = async () => {
    if (!address) return
    setNftsLoading(true)
    try {
      const res = await fetch(`/api/nfts/${address}`)
      const data = await res.json()
      setNfts(Array.isArray(data.nfts) ? data.nfts : [])
    } catch {
      setNfts([])
    } finally {
      setNftsLoading(false)
    }
  }

  useEffect(() => {
    if (pfpDialogOpen && address) {
      void loadNftsForPfp()
      setSelectedPfpNft(null)
    }
  }, [pfpDialogOpen, address])

  useEffect(() => {
    if (!pfpDialogOpen || !nfts.length || !profileStatus?.pfp_token_id) return
    const equipped = nfts.find((n) => n.tokenId === profileStatus.pfp_token_id)
    if (equipped) setSelectedPfpNft(equipped)
  }, [pfpDialogOpen, nfts, profileStatus?.pfp_token_id])

  const saveSettings = async (field?: 'name' | 'colors') => {
    if (!address || !isConnected) return
    setSavingSettings(true)
    setProfileError(null)
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          ...(field !== 'colors' ? { displayName: nameDraft } : {}),
          ...(field !== 'name' ? { bgFrom: bgFromDraft, bgTo: bgToDraft } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Save failed')
      setProfileStatus((prev) => (prev ? { ...prev, ...data } : data))
      persistProfileSnapshot(address, { ...readProfileSnapshot(address), ...data } as PersistedProfile)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingSettings(false)
    }
  }

  const applyPreset = async (from: string, to: string) => {
    setBgFromDraft(from)
    setBgToDraft(to)
    if (!address || !isConnected) return
    setSavingSettings(true)
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, bgFrom: from, bgTo: to }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileStatus((prev) => (prev ? { ...prev, ...data } : (data as ProfileStatus)))
        persistProfileSnapshot(address, { ...readProfileSnapshot(address), ...data } as PersistedProfile)
      }
    } finally {
      setSavingSettings(false)
    }
  }

  const pickPfp = async (nft: CapyNft) => {
    if (!address) return
    setSettingPfpId(nft.tokenId)
    try {
      const res = await fetch('/api/profile/set-pfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          tokenId: nft.tokenId,
          image: nft.image,
          contract: nft.contract,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileError(data?.error || 'Could not set PFP')
        return
      }
      setProfileStatus((prev) => (prev ? { ...prev, ...data } : data))
      persistProfileSnapshot(address, { ...(readProfileSnapshot(address) || {}), ...data } as PersistedProfile)
      setPfpDialogOpen(false)
      setSelectedPfpNft(null)
    } catch {
      setProfileError('Could not set PFP')
    } finally {
      setSettingPfpId(null)
    }
  }

  const isLoading = isConnecting || isAuthLoading || isBalanceLoading || isProfileLoading

  const displayAddress = useMemo(() => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }, [address])

  const displayName = useMemo(() => {
    const custom = profileStatus?.display_name?.trim()
    if (custom) return custom
    const portal = portalProfile?.user?.name?.trim()
    if (portal) return portal
    return 'Capy Camper'
  }, [profileStatus?.display_name, portalProfile?.user?.name])

  const tier = portalProfile?.user?.tier ?? 1
  const bgFrom = profileStatus?.profile_bg_from ?? DEFAULT_PROFILE_BG_FROM
  const bgTo = profileStatus?.profile_bg_to ?? DEFAULT_PROFILE_BG_TO

  const avatarUrl =
    profileStatus?.pfp_image ||
    portalProfile?.user?.pfpUrl ||
    portalProfile?.user?.avatarUrl ||
    portalProfile?.user?.avatar ||
    null

  const claimedBadges =
    (portalProfile?.user?.badges ?? []).filter((b) => b?.claimed) ?? []
  const localClaimedBadgeSlugs = useMemo(() => {
    if (!address) return []
    return readProfileSnapshot(address)?.claimed_badges ?? []
  }, [address])
  const badgeCount = localClaimedBadgeSlugs.length > 0 ? localClaimedBadgeSlugs.length : claimedBadges.length
  const highestBadgeName = useMemo(() => {
    if (localClaimedBadgeSlugs.length === 0) return null
    const lastSlug = localClaimedBadgeSlugs[localClaimedBadgeSlugs.length - 1]
    return BADGES.find((b) => b.slug === lastSlug)?.name ?? 'Badge'
  }, [localClaimedBadgeSlugs])

  const balanceFormatted =
    balanceData && 'formatted' in balanceData
      ? `${Number(balanceData.formatted).toFixed(4)} ${balanceData.symbol ?? ''}`.trim()
      : '—'

  return (
    <>
      <div
        className="w-full overflow-hidden rounded-2xl border-2 border-white/50 shadow-[0_16px_40px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:rounded-3xl"
        style={{
          background: `linear-gradient(145deg, ${bgFrom}ee, ${bgTo}ee)`,
        }}
      >
        <div className="p-4 sm:p-5">
          {/* Row 1: PFP column (avatar + Edit under) | Identity (name + address) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            {/* Left: PFP + Edit profile under */}
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <div className="relative shrink-0">
                {isConnected && editProfileOpen ? (
                  <button
                    type="button"
                    onClick={() => setPfpDialogOpen(true)}
                    className={`relative block h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-[0_8px_24px_rgba(15,23,42,0.2)] outline-none transition hover:ring-2 hover:ring-white/80 focus-visible:ring-2 focus-visible:ring-blue-600 sm:h-24 sm:w-24 ${profileStatus?.pfp_rarity ? rarityGlowClass(profileStatus.pfp_rarity) : ''}`}
                    title="Choose NFT as profile picture"
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500 to-purple-500">
                        <span className="text-2xl font-bold text-white sm:text-3xl">
                          {address ? address.slice(2, 3).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[9px] font-bold uppercase text-white">
                      Tap · NFT PFP
                    </span>
                  </button>
                ) : (
                  <div
                    className={`relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-[0_8px_24px_rgba(15,23,42,0.2)] sm:h-24 sm:w-24 ${profileStatus?.pfp_rarity ? rarityGlowClass(profileStatus.pfp_rarity) : ''}`}
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500 to-purple-500">
                        <span className="text-2xl font-bold text-white sm:text-3xl">
                          {address ? address.slice(2, 3).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isConnected && !editProfileOpen && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2 rounded-full border border-slate-300/80 bg-white/80 text-slate-800 shadow-sm hover:bg-white hover:shadow md:w-auto"
                  onClick={() => {
                    setProfileError(null)
                    if (profileStatus) {
                      setNameDraft(profileStatus.display_name ?? '')
                      setBgFromDraft(profileStatus.profile_bg_from ?? DEFAULT_PROFILE_BG_FROM)
                      setBgToDraft(profileStatus.profile_bg_to ?? DEFAULT_PROFILE_BG_TO)
                    }
                    setEditProfileOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit profile
                </Button>
              )}
            </div>

            {/* Right: Name, address, and edit panel */}
            <div className="min-w-0 flex-1 space-y-2.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600/90">
                  Camper name
                </div>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {displayName}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-slate-700/90 sm:text-sm">
                      {displayAddress}
                    </div>
                  </div>

                  {/* Highest badge earned (or empty state) */}
                  {highestBadgeName ? (
                    <div
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm"
                      title="Highest badge earned"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-inner">
                        <Award className="h-4 w-4" />
                      </span>
                      <span className="max-w-[220px] truncate">
                        {highestBadgeName}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm"
                      title="No badges yet"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-[9px] font-extrabold uppercase tracking-wide text-white shadow-inner">
                        NO
                      </span>
                      <span className="whitespace-nowrap">No badges yet, scout</span>
                    </div>
                  )}
                </div>
              </div>

              {isConnected && editProfileOpen && (
                <div className="rounded-xl border border-white/50 bg-white/35 p-3 shadow-inner backdrop-blur-sm">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit profile
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => setEditProfileOpen(false)}
                    >
                      <X className="h-4 w-4" />
                      Done
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label htmlFor="camper-name" className="text-[10px] text-slate-600">
                        Display name
                      </Label>
                      <Input
                        id="camper-name"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Your camper name"
                        maxLength={48}
                        className="h-9 border-slate-200/80 bg-white/90 text-slate-900"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 gap-1 bg-slate-900 text-white hover:bg-slate-800"
                      disabled={savingSettings}
                      onClick={() => void saveSettings('name')}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save name
                    </Button>
                  </div>

                  <div className="mt-3 border-t border-slate-200/50 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <Palette className="h-3.5 w-3.5" />
                      Card background
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {BG_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          title={p.label}
                          className="h-9 w-9 rounded-full border-2 border-white shadow-md ring-offset-2 transition hover:scale-105 hover:ring-2 hover:ring-slate-400"
                          style={{
                            background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                          }}
                          onClick={() => void applyPreset(p.from, p.to)}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgFromDraft}
                          onChange={(e) => setBgFromDraft(e.target.value)}
                          className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white"
                          aria-label="From color"
                        />
                        <input
                          type="color"
                          value={bgToDraft}
                          onChange={(e) => setBgToDraft(e.target.value)}
                          className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white"
                          aria-label="To color"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={savingSettings}
                        onClick={() => void saveSettings('colors')}
                      >
                        Save colors
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2 border-slate-300 bg-white/80"
                    onClick={() => setPfpDialogOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Use my NFT as profile picture
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-[11px] text-slate-600">Syncing…</div>
              )}
              {profileError && (
                <div className="text-[11px] text-red-700">{profileError}</div>
              )}
              {!isConnected && !isLoading && (
                <div className="text-[11px] text-slate-600">
                  Connect wallet to edit your profile.
                </div>
              )}
            </div>
          </div>

          {/* Stats strip: pills + streak claim */}
          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/40 pt-4 sm:mt-5 sm:pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-blue-600/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Tier {tier}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-800 shadow-sm">
                {isBalanceLoading ? '…' : balanceFormatted}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-amber-100/90 px-2.5 py-1 text-[10px] font-medium text-amber-900 shadow-sm">
                <Zap className="h-2.5 w-2.5 text-amber-600" />
                {streak > 0 ? `${streak}d` : '—'} streak
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/70 bg-blue-50/90 px-2.5 py-1 text-[10px] font-semibold text-blue-900 shadow-sm">
                <Trophy className="h-2.5 w-2.5 text-blue-600" />
                {totalXp !== null ? totalXp.toLocaleString() : '—'} XP
                {xpJustClaimed > 0 && (
                  <span className="ml-0.5 rounded bg-blue-500 px-1 py-0.5 text-[9px] font-bold text-white">
                    +{xpJustClaimed}
                  </span>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/70 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-medium text-emerald-900 shadow-sm">
                <Award className="h-2.5 w-2.5 text-emerald-600" />
                {badgeCount} badge{badgeCount === 1 ? '' : 's'}
              </span>
              {profileStatus?.pfp_rarity && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-white/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${RARITY_BADGE_CLASSES[profileStatus.pfp_rarity]}`}
                >
                  {rarityLabel(profileStatus.pfp_rarity)} PFP
                </span>
              )}
            </div>
            {isConnected && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 rounded-full border-amber-400/80 bg-amber-100/90 px-3 text-[10px] font-semibold text-amber-900 hover:bg-amber-200/90"
                  onClick={() => void handleStreakClaim()}
                  disabled={hasClaimedToday || streakClaiming}
                >
                  {streakClaiming ? 'Sign & claim…' : hasClaimedToday ? 'Streak claimed' : 'Claim 10 XP (streak)'}
                </Button>
                {streakError && (
                  <span className="text-[10px] text-red-600">{streakError}</span>
                )}
                <span className="text-[10px] text-slate-600/90">7th day = +50 XP bonus</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-slate-200 bg-slate-50">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Choose a CapyCamp NFT
            </DialogTitle>
            <p className="text-xs text-slate-600">
              Tap an NFT to select it, then tap <strong>Save</strong> to use it as
              your profile picture. XP perks follow that NFT&apos;s rarity.
            </p>
          </DialogHeader>
          {nftsLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : nfts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No CapyCamp NFTs found for this wallet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {nfts.map((nft) => {
                  const selected = selectedPfpNft?.tokenId === nft.tokenId
                  return (
                    <button
                      key={`${nft.contract}-${nft.tokenId}`}
                      type="button"
                      disabled={settingPfpId !== null}
                      onClick={() => setSelectedPfpNft(nft)}
                      className={[
                        'flex flex-col gap-1 rounded-xl border-2 bg-white p-1 text-left shadow-sm transition hover:shadow-md disabled:opacity-50',
                        selected
                          ? 'border-emerald-500 ring-2 ring-emerald-400/60'
                          : 'border-slate-200 hover:border-blue-300',
                      ].join(' ')}
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
                        {nft.image ? (
                          <Image
                            src={nft.image}
                            alt={nft.name}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                            #{nft.tokenId}
                          </div>
                        )}
                        {selected && (
                          <span className="absolute right-0.5 top-0.5 rounded bg-emerald-600 px-1 py-0.5 text-[8px] font-bold text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <span className="truncate px-0.5 text-[10px] font-medium text-slate-800">
                        +{nft.xpBoostPercent ?? 0}% Bonus XP
                      </span>
                    </button>
                  )
                })}
              </div>
              <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-300 sm:w-auto"
                  disabled={settingPfpId !== null}
                  onClick={() => {
                    setSelectedPfpNft(null)
                    setPfpDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                  disabled={!selectedPfpNft || settingPfpId !== null}
                  onClick={() =>
                    selectedPfpNft && void pickPfp(selectedPfpNft)
                  }
                >
                  {settingPfpId ? (
                    'Saving…'
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save as profile picture
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
