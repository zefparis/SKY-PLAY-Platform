'use client'

import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js'
import { create } from 'zustand'

export type AuthTokens = {
  accessToken: string
  idToken: string
  refreshToken: string
}

export type AuthUser = {
  id: string
  email: string
  username: string
  role?: string
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

type AuthStoreState = {
  tokens: AuthTokens | null
  user: AuthUser | null
  isLoading: boolean
  initialized: boolean
  error: string | null
  confirmEmail: string | null
  signup: (email: string, password: string) => Promise<void>
  confirmSignup: (email: string, code: string, password?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => void
  loginWithDiscord: () => void
  handleOAuthCallback: (code: string) => Promise<void>
  handleDiscordCallback: (code: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  restoreSession: () => Promise<void>
  clearError: () => void
  setConfirmEmail: (email: string | null) => void
  logout: () => void
}

const STORAGE_KEY = 'skyplay-auth'
const PASSWORD_CACHE_KEY = 'skyplay-auth-confirm-password'

const COGNITO_CONFIG = {
  domain: 'https://eu-west-1sznqqakay.auth.eu-west-1.amazoncognito.com',
  clientId: '5f29473pmgndvnqlavstf8abnu',
  redirectSignIn: 'https://sky-play-platform.vercel.app/auth/callback',
  userPoolId: 'eu-west-1_szNqQAkay',
  apiUrl: 'https://skyplayapi-production.up.railway.app',
} as const

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const getUserPool = (): CognitoUserPool => {
  return new CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.userPoolId,
    ClientId: COGNITO_CONFIG.clientId,
  })
}

const createCognitoUser = (email: string): CognitoUser => {
  return new CognitoUser({
    Username: normalizeEmail(email),
    Pool: getUserPool(),
  })
}

const parseStoredState = (): Pick<AuthStoreState, 'tokens' | 'user' | 'confirmEmail'> => {
  if (typeof window === 'undefined') {
    return { tokens: null, user: null, confirmEmail: null }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { tokens: null, user: null, confirmEmail: null }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Pick<AuthStoreState, 'tokens' | 'user' | 'confirmEmail'>>
    return {
      tokens: parsed.tokens ?? null,
      user: parsed.user ?? null,
      confirmEmail: parsed.confirmEmail ?? null,
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return { tokens: null, user: null, confirmEmail: null }
  }
}

const persistState = (state: Pick<AuthStoreState, 'tokens' | 'user' | 'confirmEmail'>): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const readCachedPassword = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.sessionStorage.getItem(PASSWORD_CACHE_KEY)
}

const writeCachedPassword = (password: string | null): void => {
  if (typeof window === 'undefined') {
    return
  }

  if (password) {
    window.sessionStorage.setItem(PASSWORD_CACHE_KEY, password)
    return
  }

  window.sessionStorage.removeItem(PASSWORD_CACHE_KEY)
}

const translateCognitoError = (error: unknown): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null

  if (code === 'UsernameExistsException') {
    return 'Un compte existe déjà avec cet email'
  }

  if (code === 'NotAuthorizedException') {
    return 'Email ou mot de passe incorrect'
  }

  if (code === 'CodeMismatchException') {
    return 'Code invalide'
  }

  if (code === 'InvalidPasswordException') {
    return 'Le mot de passe doit contenir 8 caractères, une majuscule et un chiffre'
  }

  if (code === 'UserNotConfirmedException') {
    return 'Compte non confirmé, vérifie ta boîte mail'
  }

  if (error instanceof Error && error.message === 'NEW_PASSWORD_REQUIRED') {
    return 'Ce compte nécessite une mise à jour du mot de passe depuis votre profil'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Une erreur est survenue pendant l’authentification'
}

const syncUser = async (tokens: AuthTokens): Promise<AuthUser> => {
  const apiUrl = COGNITO_CONFIG.apiUrl.replace(/\/+$/, '')

  const response = await fetch(`${apiUrl}/users/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.idToken || tokens.accessToken}`,
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Échec synchronisation utilisateur (${response.status}): ${details || response.statusText}`)
  }

  return (await response.json()) as AuthUser
}

const loginWithSrp = async (email: string, password: string): Promise<AuthTokens> => {
  const user = createCognitoUser(email)
  const authenticationDetails = new AuthenticationDetails({
    Username: normalizeEmail(email),
    Password: password,
  })

  return new Promise<AuthTokens>((resolve, reject) => {
    user.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        })
      },
      onFailure: (error) => reject(error),
      newPasswordRequired: () => reject(new Error('NEW_PASSWORD_REQUIRED')),
    })
  })
}

const refreshWithToken = async (email: string, refreshToken: string): Promise<AuthTokens> => {
  const user = createCognitoUser(email)
  const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: refreshToken })

  return new Promise<AuthTokens>((resolve, reject) => {
    user.refreshSession(cognitoRefreshToken, (error, session) => {
      if (error || !session) {
        reject(error ?? new Error('Session invalide'))
        return
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken,
      })
    })
  })
}

const initialState = parseStoredState()

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  tokens: initialState.tokens,
  user: initialState.user,
  isLoading: false,
  initialized: false,
  error: null,
  confirmEmail: initialState.confirmEmail,

  clearError: () => {
    set({ error: null })
  },

  setConfirmEmail: (email) => {
    const nextConfirmEmail = email ? normalizeEmail(email) : null
    set({ confirmEmail: nextConfirmEmail })
    persistState({
      tokens: get().tokens,
      user: get().user,
      confirmEmail: nextConfirmEmail,
    })
  },

  signup: async (email, password) => {
    const normalizedEmail = normalizeEmail(email)
    set({ isLoading: true, error: null })

    try {
      const attributes = [new CognitoUserAttribute({ Name: 'email', Value: normalizedEmail })]

      await new Promise<void>((resolve, reject) => {
        getUserPool().signUp(normalizedEmail, password, attributes, [], (error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })

      writeCachedPassword(password)
      set({ confirmEmail: normalizedEmail, isLoading: false, error: null })
      persistState({ tokens: get().tokens, user: get().user, confirmEmail: normalizedEmail })
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  confirmSignup: async (email, code, password) => {
    const normalizedEmail = normalizeEmail(email)
    set({ isLoading: true, error: null })

    try {
      await new Promise<void>((resolve, reject) => {
        createCognitoUser(normalizedEmail).confirmRegistration(code, true, (error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })

      const passwordToUse = password ?? readCachedPassword()

      if (passwordToUse) {
        await get().login(normalizedEmail, passwordToUse)
      } else {
        set({ isLoading: false, error: null, confirmEmail: null })
        persistState({ tokens: get().tokens, user: get().user, confirmEmail: null })
      }

      writeCachedPassword(null)
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  login: async (email, password) => {
    const normalizedEmail = normalizeEmail(email)
    set({ isLoading: true, error: null })

    try {
      const tokens = await loginWithSrp(normalizedEmail, password)
      const user = await syncUser(tokens)

      set({
        tokens,
        user,
        isLoading: false,
        error: null,
        confirmEmail: null,
      })

      persistState({ tokens, user, confirmEmail: null })
      writeCachedPassword(null)
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  loginWithGoogle: () => {
    const domain = COGNITO_CONFIG.domain.replace(/\/+$/, '')
    const clientId = COGNITO_CONFIG.clientId
    const redirectUri = COGNITO_CONFIG.redirectSignIn

    if (!domain || !clientId) {
      console.error('Configuration Cognito manquante pour loginWithGoogle', {
        domain,
        clientId,
      })
      return
    }

    const url = new URL(`${domain}/oauth2/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('identity_provider', 'Google')

    set({ error: null })
    window.location.assign(url.toString())
  },

  loginWithDiscord: () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1487774336126554273'
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://sky-play-platform.vercel.app/auth/discord/callback'

    const url = new URL('https://discord.com/oauth2/authorize')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'identify email')

    set({ error: null })
    window.location.assign(url.toString())
  },

  handleDiscordCallback: async (code) => {
    set({ isLoading: true, error: null })

    try {
      const apiUrl = COGNITO_CONFIG.apiUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${apiUrl}/auth/discord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const details = await response.text().catch(() => '')
        throw new Error(`Échec authentification Discord (${response.status}): ${details || response.statusText}`)
      }

      const data = await response.json()
      const tokens: AuthTokens = {
        accessToken: data.tokens.accessToken,
        idToken: data.tokens.idToken,
        refreshToken: data.tokens.refreshToken || '',
      }

      set({
        tokens,
        user: data.user,
        isLoading: false,
        error: null,
        confirmEmail: null,
      })

      persistState({ tokens, user: data.user, confirmEmail: null })
      window.location.assign('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'authentification Discord'
      set({ isLoading: false, error: message, tokens: null, user: null })
      persistState({ tokens: null, user: null, confirmEmail: get().confirmEmail })
      throw new Error(message)
    }
  },

  handleOAuthCallback: async (code) => {
    set({ isLoading: true, error: null })

    try {
      const domain = COGNITO_CONFIG.domain.replace(/\/+$/, '')
      const clientId = COGNITO_CONFIG.clientId
      const redirectUri = COGNITO_CONFIG.redirectSignIn

      const response = await fetch(`${domain}/oauth2/token`, {
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

      if (!response.ok) {
        const details = await response.text().catch(() => '')
        throw new Error(`Échec échange OAuth (${response.status}): ${details || response.statusText}`)
      }

      const tokenData = (await response.json()) as TokenExchangeResponse
      const tokens: AuthTokens = {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token ?? '',
      }

      const user = await syncUser(tokens)

      set({
        tokens,
        user,
        isLoading: false,
        error: null,
        confirmEmail: null,
      })

      persistState({ tokens, user, confirmEmail: null })
      window.location.assign('/')
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message, tokens: null, user: null })
      persistState({ tokens: null, user: null, confirmEmail: get().confirmEmail })
      throw new Error(message)
    }
  },

  restoreSession: async () => {
    const currentTokens = get().tokens
    const currentUser = get().user

    if (!currentTokens || !currentUser?.email || !currentTokens.refreshToken) {
      set({ initialized: true })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const tokens = await refreshWithToken(currentUser.email, currentTokens.refreshToken)
      const user = await syncUser(tokens)

      set({ tokens, user, isLoading: false, initialized: true, error: null })
      persistState({ tokens, user, confirmEmail: get().confirmEmail })
    } catch {
      set({ tokens: null, user: null, isLoading: false, initialized: true, error: null })
      persistState({ tokens: null, user: null, confirmEmail: get().confirmEmail })
    }
  },

  forgotPassword: async (email) => {
    const normalizedEmail = normalizeEmail(email)
    set({ isLoading: true, error: null })
    try {
      await new Promise<void>((resolve, reject) => {
        createCognitoUser(normalizedEmail).forgotPassword({
          onSuccess: () => resolve(),
          onFailure: (error) => reject(error),
          inputVerificationCode: () => resolve(),
        })
      })
      set({ isLoading: false, error: null })
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  resetPassword: async (email, code, newPassword) => {
    const normalizedEmail = normalizeEmail(email)
    set({ isLoading: true, error: null })
    try {
      await new Promise<void>((resolve, reject) => {
        createCognitoUser(normalizedEmail).confirmPassword(code, newPassword, {
          onSuccess: () => resolve(),
          onFailure: (error) => reject(error),
        })
      })
      set({ isLoading: false, error: null })
    } catch (error) {
      const message = translateCognitoError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  logout: () => {
    getUserPool().getCurrentUser()?.signOut()
    set({ tokens: null, user: null, error: null, isLoading: false, confirmEmail: null })
    persistState({ tokens: null, user: null, confirmEmail: null })
    writeCachedPassword(null)
  },
}))