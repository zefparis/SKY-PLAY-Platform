'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cognitoLogin, cognitoLogout, cognitoRefresh, cognitoSignup } from '@/features/auth/cognito'
import { api, setAuthToken } from '@/lib/api'

export type AuthTokens = {
  accessToken: string
  idToken: string
  refreshToken: string
}

type AuthState = {
  status: 'anonymous' | 'authenticating' | 'authenticated'
  email: string | null
  tokens: AuthTokens | null
  user: any | null
  error: string | null

  hydrate: () => Promise<void>
  signup: (params: { email: string; password: string; username?: string }) => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'anonymous',
      email: null,
      tokens: null,
      user: null,
      error: null,

      hydrate: async () => {
        const tokens = get().tokens
        if (tokens?.accessToken) {
          setAuthToken(tokens.accessToken)
          try {
            const { data } = await api.get('/auth/me')
            set({ status: 'authenticated', user: data.user, error: null })
          } catch {
            // token invalide / expiré => tentative refresh
            try {
              await get().refresh()
            } catch {
              await get().logout()
            }
          }
        }
      },

      signup: async ({ email, password, username }) => {
        set({ status: 'authenticating', error: null })
        try {
          await cognitoSignup({ email, password, username })
          // Selon la config du pool, un code de confirmation peut être requis.
          // Ici on laisse l'utilisateur se connecter ensuite.
          set({ status: 'anonymous' })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Signup failed' })
          throw e
        }
      },

      login: async ({ email, password }) => {
        set({ status: 'authenticating', error: null })
        try {
          const tokens = await cognitoLogin({ email, password })
          setAuthToken(tokens.accessToken)
          const { data } = await api.get('/auth/me')
          set({ status: 'authenticated', email, tokens, user: data.user, error: null })
        } catch (e: any) {
          setAuthToken(null)
          set({ status: 'anonymous', tokens: null, user: null, error: e?.message || 'Login failed' })
          throw e
        }
      },

      refresh: async () => {
        const { email, tokens } = get()
        if (!email || !tokens?.refreshToken) throw new Error('No refresh token')

        const next = await cognitoRefresh({ email, refreshToken: tokens.refreshToken })
        const merged: AuthTokens = { ...tokens, ...next }
        setAuthToken(merged.accessToken)
        const { data } = await api.get('/auth/me')
        set({ status: 'authenticated', tokens: merged, user: data.user, error: null })
      },

      logout: async () => {
        cognitoLogout()
        setAuthToken(null)
        set({ status: 'anonymous', email: null, tokens: null, user: null, error: null })
      },
    }),
    {
      name: 'skyplay-auth',
      partialize: (state) => ({ email: state.email, tokens: state.tokens }),
    }
  )
)
