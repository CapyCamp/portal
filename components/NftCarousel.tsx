'use client'

import Image from 'next/image'

const CAROUSEL_IMAGES = [
  '1632', '1633', '1643', '1671', '1674', '1690', '1814', '1824', '1829', '1848',
  '1994', '2005', '2142', '2151', '2152', '2156', '2297', '2300', '2307', '2312',
]

export function NftCarousel() {
  const images = CAROUSEL_IMAGES.map((id) => `/carousel/${id}.png`)
  const duplicated = [...images, ...images]

  return (
    <section className="w-full min-w-0 space-y-3 sm:space-y-4">
      <h2 className="text-center text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:tracking-[0.2em] sm:text-lg">
        CapyCamp NFTs
      </h2>
      <div className="w-full min-w-0 overflow-hidden bg-slate-900/5 shadow-[0_10px_25px_rgba(15,23,42,0.18)]">
        <div
          className="flex w-max gap-2 py-3 sm:gap-3 sm:py-4"
          style={{
            animation: 'nft-carousel-scroll 45s linear infinite',
            animationDirection: 'normal',
          }}
        >
          {duplicated.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-amber-200/80 shadow-md sm:h-32 sm:w-32 md:h-40 md:w-40"
            >
              <Image
                src={src}
                alt={`CapyCamp NFT ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
