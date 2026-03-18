'use client'

import { useMemo } from 'react'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'
import { useAccount } from 'wagmi'

type ConnectWalletProps = {
  className?: string
}

export function ConnectWallet({ className }: ConnectWalletProps) {
  const { address, isConnecting, isConnected } = useAccount()
  const { login, logout, isLoading } = useLoginWithAbstract()

  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }, [address])

  const handleClick = () => {
    if (isConnected) {
      logout()
    } else {
      login()
    }
  }

  const label = isConnected ? 'Disconnect' : 'Connect Wallet'
  const sublabel = isConnected ? shortAddress : 'Abstract Global Wallet'

  const disabled = isLoading || isConnecting

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        'inline-flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-2xl border-2 border-amber-300 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-[0_10px_20px_rgba(15,23,42,0.35)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70',
        className ?? '',
      ].join(' ')}
    >
      <span>{disabled ? 'Loading…' : label}</span>
      <span className="mt-0.5 text-[10px] font-medium text-slate-600">{sublabel}</span>
    </button>
  )
}

