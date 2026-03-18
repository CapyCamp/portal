'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { BottomDock } from './BottomDock'
import { ConnectWallet } from '@/components/ConnectWallet'
import { XPBar } from '@/components/XPBar'
import { AutoClaimXP } from '@/components/AutoClaimXP'

export function CapyCampLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isBrand = pathname === '/brand'

  return (
    <div
      className={`relative min-h-dvh h-screen w-full min-w-0 overflow-hidden ${isBrand ? 'bg-linear-to-br from-blue-50 via-amber-50 to-green-50' : ''}`}
      style={
        isBrand
          ? undefined
          : {
              backgroundImage: "url('/background.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }
      }
    >
      {/* Flying bees - only on non-Brand pages */}
      {!isBrand && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          {[
            { left: '8%', top: '15%', anim: 'bee-fly-1', dur: '18s', delay: '0s', scale: 0.9 },
            { left: '22%', top: '72%', anim: 'bee-fly-2', dur: '22s', delay: '-4s', scale: 1 },
            { left: '45%', top: '25%', anim: 'bee-fly-3', dur: '20s', delay: '-8s', scale: 0.85 },
            { left: '68%', top: '55%', anim: 'bee-fly-1', dur: '24s', delay: '-2s', scale: 1.1 },
            { left: '85%', top: '35%', anim: 'bee-fly-2', dur: '19s', delay: '-6s', scale: 0.95 },
            { left: '35%', top: '85%', anim: 'bee-fly-3', dur: '21s', delay: '-10s', scale: 0.8 },
            { left: '78%', top: '18%', anim: 'bee-fly-1', dur: '23s', delay: '-3s', scale: 0.9 },
            { left: '12%', top: '48%', anim: 'bee-fly-2', dur: '17s', delay: '-5s', scale: 1 },
          ].map((bee, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: bee.left,
                top: bee.top,
                transform: `scale(${bee.scale})`,
              }}
            >
              <div
                style={{
                  animation: `${bee.anim} ${bee.dur} ease-in-out infinite`,
                  animationDelay: bee.delay,
                }}
              >
                <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="drop-shadow-md"
              >
                <ellipse cx="16" cy="18" rx="8" ry="10" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
                <path d="M8 14 L8 10 M24 14 L24 10" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 8 Q16 6 20 8" stroke="#1C1917" strokeWidth="1" fill="none" />
                <ellipse cx="16" cy="18" rx="8" ry="10" fill="none" stroke="#78716C" strokeWidth="0.8" strokeDasharray="2 3" />
                <g style={{ animation: 'bee-wing 0.15s ease-in-out infinite' }}>
                  <ellipse cx="10" cy="14" rx="6" ry="4" fill="rgba(255,255,255,0.7)" stroke="#94A3B8" strokeWidth="0.8" transform="rotate(-20 10 14)" />
                  <ellipse cx="22" cy="14" rx="6" ry="4" fill="rgba(255,255,255,0.7)" stroke="#94A3B8" strokeWidth="0.8" transform="rotate(20 22 14)" />
                </g>
              </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      <AutoClaimXP />
      {/* Top HUD - Floating */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-40">
        <div className="relative h-20 sm:h-24 md:h-28">
          {/* Logo */}
          <div className="pointer-events-auto absolute -top-2 left-2 sm:-top-4 sm:left-4 md:left-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="min-h-[44px] min-w-[44px] transition-transform hover:scale-110 active:scale-95 touch-manipulation"
              aria-label="CapyCamp Home"
            >
              <Image
                src="/nocap.png"
                alt="CapyCamp"
                width={160}
                height={160}
                className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 drop-shadow-lg"
              />
            </button>
          </div>

          {/* XP Bar - Center (real XP from profile) */}
          <div className="pointer-events-auto absolute left-1/2 top-8 -translate-x-1/2 transform sm:top-10 md:top-12">
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 sm:-top-12 md:-top-16">
              <Image
                src="/capy-lay.png"
                alt="Capy resting at CapyCamp"
                width={96}
                height={96}
                className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 drop-shadow-[0_10px_25px_rgba(15,23,42,0.55)]"
              />
            </div>
            <XPBar />
          </div>

          {/* Wallet - Right: Abstract connect button */}
          {!isBrand && (
            <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-1.5 sm:right-4 sm:top-4 sm:gap-3 md:right-6">
              <ConnectWallet />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={[
          'absolute inset-0 overflow-x-hidden overflow-y-auto',
          // Brand page should be full-bleed (no reserved HUD/dock whitespace)
          isBrand ? 'p-0' : 'pb-24 pt-20 sm:pb-28 sm:pt-24 md:pb-32 md:pt-28',
        ].join(' ')}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Dock - fixed, centered, scrollable icons only */}
      <BottomDock />
    </div>
  )
}

