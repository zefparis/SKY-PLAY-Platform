'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type GameProvider = 'STEAM' | 'EPIC' | 'DISCORD' | 'TWITCH'

export interface LinkedAccount {
  id: string
  provider: GameProvider
  externalId: string
  username: string | null
  avatarUrl: string | null
  profileUrl: string | null
  isVerified: boolean
  createdAt: string
}

export function useLinkedAccounts() {
  const tokens = useAuthStore((s) => s.tokens)
  const token = tokens?.idToken || tokens?.accessToken
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    if (!token) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const res = await fetch(`${API}/users/me/linked-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setAccounts(await res.json())
    } catch {}
    finally { setIsLoading(false) }
  }, [token])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  return { accounts, isLoading, refetch: fetchAccounts }
}
