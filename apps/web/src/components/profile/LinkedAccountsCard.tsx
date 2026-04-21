'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useLinkedAccounts, LinkedAccount } from '@/hooks/useLinkedAccounts'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function SteamLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.718L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z" />
    </svg>
  )
}

function EpicLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path d="M3 2v20h18V2H3zm9 3l5 3-5 3V5zm-4 4h2v6H8V9zm8 6l-5-3 5-3v6z" />
    </svg>
  )
}

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-white font-semibold mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
          >
            Délier
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProviderRowProps {
  provider: 'STEAM' | 'EPIC'
  account: LinkedAccount | null
  onConnect: (provider: 'STEAM' | 'EPIC') => Promise<void>
  onUnlink: (provider: 'STEAM' | 'EPIC') => Promise<void>
  isConnecting: boolean
  isUnlinking: boolean
}

function ProviderRow({
  provider,
  account,
  onConnect,
  onUnlink,
  isConnecting,
  isUnlinking,
}: ProviderRowProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const label = provider === 'STEAM' ? 'Steam' : 'Epic Games'
  const Logo = provider === 'STEAM' ? SteamLogo : EpicLogo

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#0d1020] border border-[#2a2d3e]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="shrink-0 p-2 rounded-lg bg-[#2a2d3e]">
          <Logo />
        </div>

        {account ? (
          <div className="flex items-center gap-3 min-w-0">
            {account.avatarUrl && (
              <img
                src={account.avatarUrl}
                alt={account.username ?? label}
                className="w-9 h-9 rounded-full shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{account.username ?? label}</p>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                ✅ Vérifié
              </span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white font-semibold">{label}</p>
            <p className="text-white/40 text-xs">Non lié</p>
          </div>
        )}
      </div>

      <div className="shrink-0">
        {account ? (
          <>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isUnlinking}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {isUnlinking ? '…' : 'Délier'}
            </button>
            {showConfirm && (
              <ConfirmModal
                message={`Es-tu sûr de vouloir délier ce compte ${label} ?`}
                onConfirm={() => { setShowConfirm(false); onUnlink(provider) }}
                onCancel={() => setShowConfirm(false)}
              />
            )}
          </>
        ) : (
          <button
            onClick={() => onConnect(provider)}
            disabled={isConnecting}
            className="px-4 py-2 rounded-lg bg-[#0097FC]/10 text-[#0097FC] border border-[#0097FC]/20 text-sm font-semibold hover:bg-[#0097FC]/20 transition disabled:opacity-50"
          >
            {isConnecting ? '…' : 'Connecter'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function LinkedAccountsCard() {
  const tokens = useAuthStore((s) => s.tokens)
  const token = tokens?.idToken || tokens?.accessToken
  const { accounts, isLoading, refetch } = useLinkedAccounts()
  const [connectingProvider, setConnectingProvider] = useState<'STEAM' | 'EPIC' | null>(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState<'STEAM' | 'EPIC' | null>(null)

  const steamAccount = accounts.find((a) => a.provider === 'STEAM') ?? null
  const epicAccount = accounts.find((a) => a.provider === 'EPIC') ?? null

  const handleConnect = async (provider: 'STEAM' | 'EPIC') => {
    if (!token) return
    setConnectingProvider(provider)
    try {
      const route = provider === 'STEAM' ? 'steam' : 'epic'
      const res = await fetch(`${API}/auth/${route}/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to get connect URL')
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      console.error(`Error connecting ${provider}:`, err)
      setConnectingProvider(null)
    }
  }

  const handleUnlink = async (provider: 'STEAM' | 'EPIC') => {
    if (!token) return
    setUnlinkingProvider(provider)
    try {
      const res = await fetch(`${API}/users/me/linked-accounts/${provider}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) await refetch()
    } catch (err) {
      console.error(`Error unlinking ${provider}:`, err)
    } finally {
      setUnlinkingProvider(null)
    }
  }

  return (
    <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-xl p-6">
      <h2 className="text-white font-bold text-lg mb-1">🎮 Comptes de jeu liés</h2>
      <p className="text-white/50 text-sm mb-5">
        Lie tes comptes pour vérifier automatiquement tes résultats
      </p>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <ProviderRow
            provider="STEAM"
            account={steamAccount}
            onConnect={handleConnect}
            onUnlink={handleUnlink}
            isConnecting={connectingProvider === 'STEAM'}
            isUnlinking={unlinkingProvider === 'STEAM'}
          />
          <ProviderRow
            provider="EPIC"
            account={epicAccount}
            onConnect={handleConnect}
            onUnlink={handleUnlink}
            isConnecting={connectingProvider === 'EPIC'}
            isUnlinking={unlinkingProvider === 'EPIC'}
          />
        </div>
      )}
    </div>
  )
}
