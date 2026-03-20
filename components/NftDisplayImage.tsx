'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { NFT_LOCAL_IMAGE_FALLBACK_SRC } from '@/lib/nft-local-image'

type NftDisplayImageProps = {
  src: string
  alt: string
  /** Shown if `src` and branded fallback fail to load */
  nameFallback: string
  fill?: boolean
  width?: number
  height?: number
  /** Applied to wrapper when not using fill */
  className?: string
  sizes?: string
  /** Passed to next/image (object-cover / object-contain, etc.) */
  imgClassName?: string
  /** Final fallback (name) container — match surrounding layout (grid vs modal) */
  textFallbackClassName?: string
  loading?: 'lazy' | 'eager'
}

/**
 * Local NFT art with lazy loading and fallback chain: primary PNG → `/nocap.png` → name label.
 */
export function NftDisplayImage({
  src,
  alt,
  nameFallback,
  fill,
  width,
  height,
  className,
  sizes,
  imgClassName,
  textFallbackClassName,
  loading = 'lazy',
}: NftDisplayImageProps) {
  const [phase, setPhase] = useState<'primary' | 'branded' | 'text'>('primary')

  const handleError = useCallback(() => {
    setPhase((p) => {
      if (p === 'primary') return 'branded'
      if (p === 'branded') return 'text'
      return p
    })
  }, [])

  if (phase === 'text') {
    return (
      <div
        className={
          textFallbackClassName ??
          'flex h-full min-h-[72px] w-full items-center justify-center bg-linear-to-br from-amber-400 to-sky-400 p-1 text-[9px] font-semibold text-white'
        }
      >
        {nameFallback}
      </div>
    )
  }

  const activeSrc = phase === 'primary' ? src : NFT_LOCAL_IMAGE_FALLBACK_SRC

  if (fill) {
    return (
      <Image
        src={activeSrc}
        alt={alt}
        fill
        className={imgClassName}
        sizes={sizes}
        loading={loading}
        onError={handleError}
      />
    )
  }

  return (
    <div className={className}>
      <Image
        src={activeSrc}
        alt={alt}
        width={width ?? 1}
        height={height ?? 1}
        className={imgClassName}
        sizes={sizes}
        loading={loading}
        onError={handleError}
      />
    </div>
  )
}
