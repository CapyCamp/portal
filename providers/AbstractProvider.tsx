'use client'

import type { ReactNode } from 'react'
import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { abstract } from 'viem/chains'

type Props = {
  children: ReactNode
}

export default function AbstractProvider({ children }: Props) {
  return (
    <AbstractWalletProvider chain={abstract}>
      {children}
    </AbstractWalletProvider>
  )
}

