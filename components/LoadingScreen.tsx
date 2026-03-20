'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CAMP_WALLPAPER_BASE } from '@/lib/camp-wallpaper-style'

const LOADING_DURATION_MS = 5000
const INTRO_AUDIO_SRC = '/intro.mp3'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const introPlayedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [tapForSound, setTapForSound] = useState(false)

  const playIntro = useCallback(() => {
    if (introPlayedRef.current) return
    const audio = audioRef.current ?? new Audio(INTRO_AUDIO_SRC)
    if (!audioRef.current) audioRef.current = audio
    introPlayedRef.current = true
    setTapForSound(false)
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  useEffect(() => {
    const audio = new Audio(INTRO_AUDIO_SRC)
    audioRef.current = audio
    audio.play().then(() => {
      introPlayedRef.current = true
    }).catch(() => {
      introPlayedRef.current = false
      setTapForSound(true)
    })
  }, [])

  const handleScreenTap = useCallback(() => {
    if (tapForSound) playIntro()
  }, [tapForSound, playIntro])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-default"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      aria-live="polite"
      aria-label="Loading"
      role={tapForSound ? 'button' : undefined}
      tabIndex={tapForSound ? 0 : undefined}
      onClick={handleScreenTap}
      onKeyDown={tapForSound ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playIntro() } } : undefined}
      style={CAMP_WALLPAPER_BASE}
    >
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Logo / title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-400 drop-shadow-lg sm:text-4xl md:text-5xl">
            CapyCamp
          </h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Web3 Scouts
          </p>
        </motion.div>

        <p className="text-xs font-medium text-slate-400">Loading site…</p>

        {/* Site load progress (not game XP) — fills over 5s */}
        <motion.div
          className="h-1.5 w-64 overflow-hidden rounded-full bg-slate-600/80 sm:w-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full origin-left rounded-full bg-linear-to-r from-sky-500 to-sky-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: LOADING_DURATION_MS / 1000,
              ease: 'linear',
            }}
            onAnimationComplete={onComplete}
          />
        </motion.div>

        <motion.p
          className="text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Entering camp...
        </motion.p>
        {tapForSound && (
          <p className="text-xs text-amber-400/90 animate-pulse">
            Tap anywhere to play sound
          </p>
        )}
      </div>
    </motion.div>
  )
}
