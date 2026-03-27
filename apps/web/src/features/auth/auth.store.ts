'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  cognitoConfirmSignup,
  cognitoLogin,
  cognitoLogout,
  cognitoRefresh,
  cognitoResendSignupCode,
  cognitoSignup,
  cognitoForgotPassword,
  cognitoResetPassword,
} from '@/features/auth/cognito'
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

  signupStep: 'idle' | 'pending' | 'confirmed'

  hydrate: () => Promise<void>
  signup: (params: { email: string; password: string; username?: string }) => Promise<void>
  setSignupEmailForConfirm: (email: string) => void
  confirmSignup: (params: { code: string }) => Promise<void>
  resendSignupCode: () => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  forgotPassword: (params: { email: string }) => Promise<void>
  resetPassword: (params: { email: string; code: string; newPassword: string }) => Promise<void>
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
      signupStep: 'idle',

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
          // 1. Créer l'utilisateur dans Cognito
          const { userSub } = await cognitoSignup({ email, password, username })

          // 2. Créer l'utilisateur en base de données
          try {
            await api.post('/users/register', { email, cognitoSub: userSub })
          } catch (dbError: any) {
            console.warn('Erreur création DB (non bloquant):', dbError)
            // On continue même si la DB échoue - l'utilisateur peut être créé au login
          }

          // 3. On passe en étape "pending" (confirmation email par code)
          set({ status: 'anonymous', email, signupStep: 'pending' })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Signup failed', signupStep: 'idle' })
          throw e
        }
      },

      // Permet d'initier un flow de confirmation même après refresh / deep link
      // (ex: /signup?step=confirm)
      setSignupEmailForConfirm: (email: string) => {
        set({ email, signupStep: 'pending' })
      },

      confirmSignup: async ({ code }) => {
        const email = get().email
        if (!email) throw new Error('Email manquant')
        set({ status: 'authenticating', error: null })
        try {
          await cognitoConfirmSignup({ email, code })
          set({ status: 'anonymous', signupStep: 'confirmed', error: null })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Confirmation failed', signupStep: 'pending' })
          throw e
        }
      },

      resendSignupCode: async () => {
        const email = get().email
        if (!email) throw new Error('Email manquant')
        set({ status: 'authenticating', error: null })
        try {
          await cognitoResendSignupCode({ email })
          set({ status: 'anonymous', error: null, signupStep: 'pending' })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Resend failed', signupStep: 'pending' })
          throw e
        }
      },

      login: async ({ email, password }) => {
        set({ status: 'authenticating', error: null })
        try {
          const tokens = await cognitoLogin({ email, password })
          setAuthToken(tokens.accessToken)
          const { data } = await api.get('/auth/me')
          set({ status: 'authenticated', email, tokens, user: data.user, error: null, signupStep: 'idle' })
        } catch (e: any) {
          setAuthToken(null)
          set({ status: 'anonymous', tokens: null, user: null, error: e?.message || 'Login failed' })
          throw e
        }
      },

      forgotPassword: async ({ email }) => {
        set({ status: 'authenticating', error: null })
        try {
          await cognitoForgotPassword({ email })
          // On ne change pas signupStep ici, c'est seulement pour gestion UI (modal/page)
          set({ status: 'anonymous', error: null, email })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Forgot password failed' })
          throw e
        }
      },

      resetPassword: async ({ email, code, newPassword }) => {
        set({ status: 'authenticating', error: null })
        try {
          await cognitoResetPassword({ email, code, newPassword })
          set({ status: 'anonymous', error: null })
        } catch (e: any) {
          set({ status: 'anonymous', error: e?.message || 'Reset password failed' })
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
        set({ status: 'anonymous', email: null, tokens: null, user: null, error: null, signupStep: 'idle' })
      },
    }),
    {
      name: 'skyplay-auth',
      partialize: (state) => ({ email: state.email, tokens: state.tokens, signupStep: state.signupStep }),
    }
  )
)
