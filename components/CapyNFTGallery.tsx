'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { RotateCcw } from 'lucide-react'
import { useCapyNFTs, type CapyNft } from '@/hooks/useCapyNFTs'
import {
  rarityGlowClass,
  rarityLabel,
  RARITY_BADGE_CLASSES,
} from '@/lib/capycamp-rarity'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NftDisplayImage } from '@/components/NftDisplayImage'
import { getLocalNftImageSrc } from '@/lib/nft-local-image'

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
          <span className="text-slate-500">Rarity</span>
          <span className="font-bold text-violet-700">{rarityLabel(nft.rarity)}</span>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          #{nft.tokenId} · {nft.name}
        </p>
      </div>
    </div>
  )
}

export function CapyNFTGallery() {
  const { isConnected } = useAccount()
  const { nfts, loading, error } = useCapyNFTs()
  const [expandedNft, setExpandedNft] = useState<CapyNft | null>(null)
  const [detailFlipped, setDetailFlipped] = useState(false)

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
        Collection
      </h2>

      <div className="space-y-3 rounded-2xl border-3 border-blue-200 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.25)] sm:p-5">
        {!isConnected && (
          <p className="text-xs text-slate-600 sm:text-sm">
            Connect your wallet to see your Capycampers.
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
            You don&apos;t have any CapyCamp NFTs in this wallet yet.
          </p>
        )}

        {nfts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
            {nfts.map((nft) => {
              const glow = rarityGlowClass(nft.rarity)

              return (
                <div
                  key={`${nft.contract}-${nft.tokenId}`}
                  className="relative flex flex-col rounded-2xl border-2 border-slate-200 bg-slate-50/90 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => openDetail(nft)}
                    className="flex w-full flex-col items-center gap-1 rounded-2xl px-2 pb-3 pt-3 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide sm:text-[9px] ${RARITY_BADGE_CLASSES[nft.rarity]}`}
                    >
                      {rarityLabel(nft.rarity)}
                    </span>
                    <div
                      className={`relative mx-auto aspect-square w-[85%] max-w-[96px] overflow-hidden rounded-xl border-2 border-amber-200/50 bg-slate-900/5 sm:max-w-[110px] ${glow}`}
                    >
                      <NftDisplayImage
                        src={nft.image || getLocalNftImageSrc(nft.tokenId)}
                        alt={nft.name}
                        nameFallback={nft.name}
                        fill
                        imgClassName="object-cover"
                        sizes="(max-width: 640px) 30vw, 120px"
                        loading="lazy"
                      />
                    </div>
                    <span className="flex flex-col items-center gap-0.5 text-[8px] font-extrabold uppercase leading-tight tracking-wide text-slate-700 sm:text-[9px]">
                      <span className="text-slate-500">Power</span>
                      <span className="text-sky-800 tabular-nums">{nft.powerLevel}</span>
                    </span>
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
                        <NftDisplayImage
                          src={expandedNft.image || getLocalNftImageSrc(expandedNft.tokenId)}
                          alt={expandedNft.name}
                          nameFallback={expandedNft.name}
                          fill
                          imgClassName="object-contain bg-slate-900/5"
                          sizes="400px"
                          loading="lazy"
                          textFallbackClassName="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-400 to-sky-400 text-lg font-bold text-white"
                        />
                      </div>
                    </div>

                    <div
                      className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    >
                      <NftCardBack nft={{ ...expandedNft, allTraits: expandedNft.allTraits ?? [] }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
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
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
