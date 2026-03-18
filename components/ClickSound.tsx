'use client'

import { useEffect, useRef } from 'react'

const POP_AUDIO_SRC = '/pop.mp3'

export function ClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(POP_AUDIO_SRC)
    audioRef.current = audio

    const playPop = () => {
      const a = audioRef.current
      if (!a) return
      a.currentTime = 0
      a.play().catch(() => {})
    }

    document.addEventListener('click', playPop, true)
    return () => document.removeEventListener('click', playPop, true)
  }, [])

  return null
}
