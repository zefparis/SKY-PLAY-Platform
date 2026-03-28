'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthTokens = {
  accessToken: string
  idToken: string
  refreshToken: string
}

type AuthUser = {
  id: string
  email: string
  username: string
  avatar?: string | null
  firstName?: string | null
  lastName?: string | null
  bio?: string | null
  discordTag?: string | null
  twitchUsername?: string | null
}

type TokenExchangeResponse = {
  access_token: string
  id_token: string
  refresh_token?: string
}

type AuthState = {
  tokens: AuthTokens | null
  user: AuthUser | null
  isLoading: boolean
  loginWithGoogle: () => void
  handleOAuthCallback: (code: string) => Promise<void>
  logout: () => void
}

const getRequiredEnv = (
  key:
    | 'NEXT_PUBLIC_AWS_COGNITO_DOMAIN'
    | 'NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID'
    | 'NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN'
    | 'NEXT_PUBLIC_API_URL',
): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`)
  }
  return value
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      isLoading: false,

      loginWithGoogle: () => {
        const domain = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_DOMAIN').replace(/\/+$/, '')
        const clientId = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID')
        const redirectUri = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN')

        const url = new URL(`${domain}/oauth2/authorize`)
        url.searchParams.set('client_id', clientId)
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('scope', 'email openid profile')
        url.searchParams.set('redirect_uri', redirectUri)
        url.searchParams.set('identity_provider', 'Google')
        window.location.href = url.toString()
      },

      handleOAuthCallback: async (code: string) => {
        set({ isLoading: true })

        try {
          const domain = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_DOMAIN').replace(/\/+$/, '')
          const clientId = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID')
          const redirectUri = getRequiredEnv('NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN')
          const apiUrl = getRequiredEnv('NEXT_PUBLIC_API_URL').replace(/\/+$/, '')

          const tokenResponse = await fetch(`${domain}/oauth2/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: clientId,
              code,
              redirect_uri: redirectUri,
            }),
          })

          if (!tokenResponse.ok) {
            const details = await tokenResponse.text().catch(() => '')
            throw new Error(`Échec échange OAuth (${tokenResponse.status}): ${details || tokenResponse.statusText}`)
          }

          const tokenData = (await tokenResponse.json()) as TokenExchangeResponse
          const tokens: AuthTokens = {
            accessToken: tokenData.access_token,
            idToken: tokenData.id_token,
            refreshToken: tokenData.refresh_token ?? '',
          }

          const syncResponse = await fetch(`${apiUrl}/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.idToken}`,
            },
            body: JSON.stringify({}),
          })

          if (!syncResponse.ok) {
            const details = await syncResponse.text().catch(() => '')
            throw new Error(`Échec synchronisation utilisateur (${syncResponse.status}): ${details || syncResponse.statusText}`)
          }

          const user = (await syncResponse.json()) as AuthUser
          set({ tokens, user, isLoading: false })
          window.location.href = '/'
        } catch (error) {
          set({ tokens: null, user: null, isLoading: false })
          throw error instanceof Error ? error : new Error('Échec de connexion OAuth')
        }
      },

      logout: () => {
        set({ tokens: null, user: null })
        window.location.href = '/login'
      },
    }),
    {
      name: 'skyplay-auth-store',
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
      }),
    },
  ),
)

export type { AuthTokens, AuthUser }