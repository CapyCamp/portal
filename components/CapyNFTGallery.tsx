'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { MoreVertical, RotateCcw, UserCircle2, Tent } from 'lucide-react'
import { useCapyNFTs, type CapyNft } from '@/hooks/useCapyNFTs'
import {
  rarityGlowClass,
  rarityLabel,
  RARITY_BADGE_CLASSES,
} from '@/lib/capycamp-rarity'
import type { RarityTier } from '@/lib/capycamp-rarity'
import {
  persistProfileSnapshot,
  restoreProfileIfNeeded,
  type PersistedProfile,
} from '@/lib/profile-local-storage'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ProfileStatus = {
  wallet: string
  pfp_image?: string | null
  pfp_token_id?: string | null
  pfp_contract?: string | null
  pfp_rarity?: RarityTier
  pfp_traits?: { hat: string; outfit: string; background: string }
  pfp_power_level?: number
}

function NftCardBack({ nft }: { nft: CapyNft }) {
  const rows = nft.allTraits?.length
    ? nft.allTraits
    : [
        { trait_type: 'Hat', value: nft.traits.hat },
        { trait_type: 'Outfit', value: nft.traits.outfit },
        { trait_type: 'Background', value: nft.traits.background },
      ]

  return (
    <div
      className={`flex h-full max-h-[min(72vh,440px)] min-h-[280px] w-full flex-col rounded-2xl border-2 border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 shadow-inner ${rarityGlowClass(nft.rarity)}`}
    >
      <div className="shrink-0 border-b border-slate-200/80 px-4 py-3 text-center sm:px-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Camper dossier
        </div>
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${RARITY_BADGE_CLASSES[nft.rarity]}`}
          >
            {rarityLabel(nft.rarity)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          {rows.length} trait{rows.length !== 1 ? 's' : ''}
          {!nft.allTraits?.length ? ' (partial — refresh if metadata loaded slowly)' : ''}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-4">
        <ul className="space-y-0 divide-y divide-slate-200/90 text-sm">
          {rows.map((row, i) => (
            <li
              key={`${row.trait_type}-${i}`}
              className="flex justify-between gap-3 py-2.5 first:pt-1"
            >
              <span className="shrink-0 text-slate-500 capitalize">
                {row.trait_type}
              </span>
              <span className="max-w-[58%] break-words text-right font-semibold text-slate-900">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t border-slate-200/80 px-4 py-3 text-sm sm:px-5">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Power level</span>
          <span className="font-bold text-violet-700">{nft.powerLevel}</span>
        </div>
        <div className="mt-1 flex justify-between gap-2">
          <span className="text-slate-500">Daily XP perk</span>
          <span className="font-bold text-amber-700">
            {nft.xpBoostPercent ? `+${nft.xpBoostPercent}%` : '—'}
          </span>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          #{nft.tokenId} · {nft.name}
        </p>
      </div>
    </div>
  )
}

export function CapyNFTGallery() {
  const { address, isConnected } = useAccount()
  const { nfts, loading, error } = useCapyNFTs()
  const [profile, setProfile] = useState<ProfileStatus | null>(null)
  const [savingToken, setSavingToken] = useState<string | null>(null)
  const [expandedNft, setExpandedNft] = useState<CapyNft | null>(null)
  const [detailFlipped, setDetailFlipped] = useState(false)

  useEffect(() => {
    if (!address) {
      setProfile(null)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const data = (await restoreProfileIfNeeded(address)) as ProfileStatus
        if (!cancelled) setProfile(data)
      } catch {
        // ignore
      }
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [address])

  const equippedTokenId = profile?.pfp_token_id ?? null

  const handleSetPfp = async (nft: CapyNft) => {
    if (!address || !isConnected) return
    if (savingToken === nft.tokenId) return

    try {
      setSavingToken(nft.tokenId)
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
      const body = await res.json()
      if (!res.ok) {
        console.error('Failed to set PFP:', body?.error || body)
        return
      }
      setProfile(body as ProfileStatus)
      persistProfileSnapshot(address, body as PersistedProfile)
    } catch (e) {
      console.error('Failed to set PFP', e)
    } finally {
      setSavingToken(null)
    }
  }

  const openDetail = (nft: CapyNft) => {
    setExpandedNft(nft)
    setDetailFlipped(false)
  }

  const closeDetail = () => {
    setExpandedNft(null)
    setDetailFlipped(false)
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <h2 className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:text-lg sm:tracking-[0.2em]">
        Capycampers
      </h2>

      <div className="space-y-3 rounded-2xl border-3 border-blue-200 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.25)] sm:p-5">
        {!isConnected && (
          <p className="text-xs text-slate-600 sm:text-sm">
            Connect your wallet to see your Capycampers and set your profile avatar.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 sm:text-sm">
            {error}
          </p>
        )}

        {loading && isConnected && (
          <p className="text-xs text-slate-600 sm:text-sm">
            Loading your CapyCamp NFTs...
          </p>
        )}

        {isConnected && !loading && nfts.length === 0 && (
          <p className="text-xs text-slate-700 sm:text-sm">
            You need a CapyCamp NFT to unlock your Camper avatar 🏕️
          </p>
        )}

        {profile?.pfp_token_id && profile.pfp_rarity && (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/80 p-3 text-xs sm:text-sm">
            <div className="font-extrabold uppercase tracking-wide text-emerald-800">
              Equipped camper
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-slate-600">Power level</span>{' '}
                <span className="font-bold text-slate-900">{profile.pfp_power_level ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-600">Rarity</span>{' '}
                <span className="font-bold text-slate-900">
                  {rarityLabel(profile.pfp_rarity)}
                </span>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[11px] font-semibold uppercase text-slate-500">Traits</div>
                <ul className="mt-1 flex flex-wrap gap-2">
                  <li className="rounded-lg bg-white/90 px-2 py-1 shadow-sm">
                    <span className="text-slate-500">Hat</span>{' '}
                    <span className="font-medium text-slate-900">
                      {profile.pfp_traits?.hat ?? '—'}
                    </span>
                  </li>
                  <li className="rounded-lg bg-white/90 px-2 py-1 shadow-sm">
                    <span className="text-slate-500">Outfit</span>{' '}
                    <span className="font-medium text-slate-900">
                      {profile.pfp_traits?.outfit ?? '—'}
                    </span>
                  </li>
                  <li className="rounded-lg bg-white/90 px-2 py-1 shadow-sm">
                    <span className="text-slate-500">Background</span>{' '}
                    <span className="font-medium text-slate-900">
                      {profile.pfp_traits?.background ?? '—'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {nfts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
            {nfts.map((nft) => {
              const isEquipped = equippedTokenId === nft.tokenId
              const isSaving = savingToken === nft.tokenId
              const glow = rarityGlowClass(nft.rarity)

              return (
                <div
                  key={`${nft.contract}-${nft.tokenId}`}
                  className={[
                    'relative flex flex-col rounded-2xl border-2 bg-slate-50/90 text-center shadow-sm transition-shadow hover:shadow-md',
                    isEquipped
                      ? 'border-emerald-400 bg-emerald-50/90 ring-1 ring-emerald-300/50'
                      : 'border-slate-200',
                  ].join(' ')}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="NFT actions"
                        className="absolute right-1 top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md outline-none hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={(e) => {
                          e.preventDefault()
                          void handleSetPfp(nft)
                        }}
                        disabled={isSaving}
                      >
                        <UserCircle2 className="h-4 w-4" />
                        {isSaving ? 'Setting…' : 'Set as PFP'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled
                        className="gap-2 text-slate-400"
                      >
                        <Tent className="h-4 w-4 opacity-50" />
                        Send to camp
                        <span className="ml-auto text-[10px] font-normal uppercase text-slate-400">
                          Soon
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    type="button"
                    onClick={() => openDetail(nft)}
                    className="flex w-full flex-col items-center gap-1 rounded-2xl px-2 pb-3 pt-9 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide sm:text-[9px] ${RARITY_BADGE_CLASSES[nft.rarity]}`}
                    >
                      {rarityLabel(nft.rarity)}
                    </span>
                    <div
                      className={`relative mx-auto aspect-square w-[85%] max-w-[96px] overflow-hidden rounded-xl border-2 border-amber-200/50 bg-slate-900/5 sm:max-w-[110px] ${glow}`}
                    >
                      {nft.image ? (
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 30vw, 120px"
                        />
                      ) : (
                        <div className="flex h-full min-h-[72px] w-full items-center justify-center bg-linear-to-br from-amber-400 to-sky-400 p-1 text-[9px] font-semibold text-white">
                          {nft.name}
                        </div>
                      )}
                    </div>
                    <span className="flex flex-col items-center gap-0.5 text-[8px] font-extrabold uppercase leading-tight tracking-wide text-slate-700 sm:text-[9px]">
                      <span className="text-slate-500">Bonus XP</span>
                      <span className="text-amber-700 tabular-nums">
                        +{nft.xpBoostPercent ?? 0}%
                      </span>
                    </span>
                    {isEquipped && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        Equipped
                      </span>
                    )}
                    <span className="text-[9px] font-medium text-slate-400">
                      Tap to expand
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={expandedNft !== null}
        onOpenChange={(open) => {
          if (!open) closeDetail()
        }}
      >
        <DialogContent
          className="max-h-[92vh] max-w-[min(94vw,480px)] overflow-hidden border-slate-200 bg-slate-50 p-4 sm:p-6"
          showCloseButton
        >
          {expandedNft && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{expandedNft.name}</DialogTitle>
              </DialogHeader>

              <div className="mx-auto w-full max-w-[400px]">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {expandedNft.name}
                </p>

                <div
                  className="mx-auto w-full [perspective:1200px]"
                  style={{ aspectRatio: '1', maxHeight: 'min(72vh, 420px)' }}
                >
                  <div
                    className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                    style={{
                      transform: detailFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-amber-200/60 bg-white shadow-xl [backface-visibility:hidden]"
                    >
                      <div
                        className={`relative h-full w-full ${rarityGlowClass(expandedNft.rarity)}`}
                      >
                        {expandedNft.image ? (
                          <Image
                            src={expandedNft.image}
                            alt={expandedNft.name}
                            fill
                            className="object-contain bg-slate-900/5"
                            sizes="400px"
                            priority
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-400 to-sky-400 text-lg font-bold text-white">
                            {expandedNft.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    >
                      <NftCardBack nft={{ ...expandedNft, allTraits: expandedNft.allTraits ?? [] }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-slate-300 bg-white"
                    onClick={() => setDetailFlipped((f) => !f)}
                  >
                    <RotateCcw
                      className={`h-4 w-4 transition-transform duration-500 ${detailFlipped ? 'rotate-180' : ''}`}
                    />
                    {detailFlipped ? 'Show front' : 'Flip card — all traits'}
                  </Button>
                  <Button
                    type="button"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={savingToken === expandedNft.tokenId}
                    onClick={() => void handleSetPfp(expandedNft)}
                  >
                    <UserCircle2 className="h-4 w-4" />
                    {savingToken === expandedNft.tokenId
                      ? 'Setting…'
                      : 'Set as PFP'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
