/**
 * Static NFT art served from `public/` (no OpenSea/hosted image URLs).
 *
 * Default: `public/images/{tokenId}.png` → `/images/{tokenId}.png`
 * Override: `NEXT_PUBLIC_NFT_LOCAL_IMAGE_BASE=/nfts` for `public/nfts/{tokenId}.png`
 */
export const NFT_LOCAL_IMAGE_BASE_PATH =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_NFT_LOCAL_IMAGE_BASE?.replace(/\/$/, '')) ||
  '/images'

/** Shown when `{tokenId}.png` is missing (keep in `public/`) */
export const NFT_LOCAL_IMAGE_FALLBACK_SRC = '/nocap.png'

/**
 * Map a CapyCamp token id to its public image URL (same-origin, cacheable).
 */
export function getLocalNftImageSrc(tokenId: string | number): string {
  const id = String(tokenId).trim()
  return `${NFT_LOCAL_IMAGE_BASE_PATH}/${id}.png`
}

export type WithTokenId = { tokenId: string }

/**
 * Force every NFT record to use the local art path (drops any remote URL from APIs).
 */
export function withLocalNftImageSources<T extends WithTokenId>(
  nfts: T[],
): (T & { image: string })[] {
  return nfts.map((n) => ({
    ...n,
    image: getLocalNftImageSrc(n.tokenId),
  }))
}
