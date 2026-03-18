'use client'

import type { ReactNode } from 'react'
import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { abstract } from 'viem/chains'
import { getGeneralPaymasterInput } from 'viem/zksync'
import type { Address } from 'viem'

// Default Abstract paymaster used for sponsored / gas-sponsored transactions.
// Source: Abstract docs (default paymaster for Abstract Global Wallet).
const ABSTRACT_DEFAULT_PAYMASTER = '0x5407B5040dec3D339A9247f3654E59EEccbb6391' as Address

// Called by the Abstract connector to decide which paymaster will sponsor gas.
// Returning a general paymaster makes actions gas-sponsored (no user charging).
const customPaymasterHandler = async () => {
  return {
    paymaster: ABSTRACT_DEFAULT_PAYMASTER,
    paymasterInput: getGeneralPaymasterInput({ innerInput: '0x' }),
  }
}

type Props = {
  children: ReactNode
}

export default function AbstractProvider({ children }: Props) {
  return (
    <AbstractWalletProvider chain={abstract} customPaymasterHandler={customPaymasterHandler}>
      {children}
    </AbstractWalletProvider>
  )
}

