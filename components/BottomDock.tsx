'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

type DockItem = {
  id: string
  label: string
  href: string
  iconSrc: string
  comingSoon?: boolean
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', label: 'Home', href: '/', iconSrc: '/buttons/home.png' },
  { id: 'profile', label: 'Profile', href: '/profile', iconSrc: '/buttons/profile.png' },
  { id: 'brand', label: 'Brand', href: '/brand', iconSrc: '/buttons/brand.png' },
  { id: 'lore', label: 'Lore', href: '/lore', iconSrc: '/buttons/lore.png' },
  { id: 'shop', label: 'Shop', href: '/shop', iconSrc: '/buttons/shop.png', comingSoon: true },
  { id: 'badges', label: 'Badges', href: '/badges', iconSrc: '/buttons/badges.png' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', iconSrc: '/buttons/leaderboard.png' },
]

export function BottomDock() {
  const router = useRouter()
  const pathname = usePathname()

  const initialIndex =
    DOCK_ITEMS.findIndex((item) => item.href === pathname) >= 0
      ? DOCK_ITEMS.findIndex((item) => item.href === pathname)
      : 0

  const [activeIndex, setActiveIndex] = React.useState<number>(initialIndex)
  const [popIndex, setPopIndex] = React.useState<number | null>(null)

  // Keep active state in sync with the current route
  React.useEffect(() => {
    const matchedIndex = DOCK_ITEMS.findIndex((item) => item.href === pathname)
    if (matchedIndex === -1 || matchedIndex === activeIndex) return
    setActiveIndex(matchedIndex)
  }, [pathname, activeIndex])

  const handleClick = (index: number, item: DockItem) => {
    setPopIndex(index)
    setActiveIndex(index)
    router.push(item.href)
    setTimeout(() => setPopIndex(null), 400)
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100vw-1rem)] max-w-[640px] -translate-x-1/2 sm:bottom-6 sm:w-[min(100vw-2.5rem,640px)]">
      {/* Dock shell - stays perfectly centered and never moves */}
      <div className="mx-auto flex w-full flex-col items-center">
        <div
          className="relative flex h-20 w-full max-w-[640px] items-center justify-center overflow-hidden rounded-[2rem] border-3 border-amber-800/80 shadow-[0_12px_30px_rgba(15,23,42,0.35)] sm:h-24 sm:rounded-[2.5rem] sm:border-4"
          style={{
            backgroundImage: "url('/woodbar.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Subtle overlay so icons stay readable */}
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-black/10 sm:rounded-[2.5rem]" />

          {/* Icon row - all icons visible, evenly spaced */}
          <div className="relative z-10 flex w-full flex-nowrap items-center justify-evenly gap-0.5 px-2 py-2 sm:gap-1 sm:px-4 sm:py-3">
            {/* Hide scrollbar for WebKit */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {DOCK_ITEMS.map((item, index) => {
              const isActive = index === activeIndex
              const isComingSoon = item.comingSoon

              return (
                <button
                  key={item.id}
                  type="button"
                  className="group relative flex h-14 w-14 min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center outline-none touch-manipulation sm:h-16 sm:w-16"
                  aria-label={item.label}
                  onClick={() => handleClick(index, item)}
                >
                  <motion.div
                    className={[
                      'flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-200 ease-out',
                      'aspect-square min-h-9 min-w-9',
                      isComingSoon && 'opacity-60 grayscale',
                      isActive
                        ? 'h-11 w-11 min-h-11 min-w-11 shadow-[0_10px_20px_rgba(14,165,233,0.7)] border-2 border-white/70 sm:h-14 sm:w-14 sm:min-h-14 sm:min-w-14 sm:border-[3px]'
                        : 'h-9 w-9 min-h-9 min-w-9 shadow-[0_6px_12px_rgba(15,23,42,0.25)] border-2 border-amber-200 group-hover:shadow-lg sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10 sm:border-[3px]',
                    ].join(' ')}
                    animate={{
                      scale: popIndex === index ? [1, 1.25, 1] : 1,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    <Image
                      src={item.iconSrc}
                      alt={item.label}
                      width={56}
                      height={56}
                      className="size-full object-contain"
                    />
                  </motion.div>
                  {isActive && (
                    <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] sm:mt-1 sm:text-[11px]">
                      {isComingSoon ? 'Coming soon' : item.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

