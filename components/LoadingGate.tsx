'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LoadingScreen } from './LoadingScreen'

export function LoadingGate({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(true)

  const handleComplete = useCallback(() => {
    setShowLoader(false)
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <LoadingScreen key="loading-screen" onComplete={handleComplete} />
        )}
      </AnimatePresence>
      {children}
    </>
  )
}
