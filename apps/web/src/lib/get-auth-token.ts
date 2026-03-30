/**
 * Récupère le token d'authentification depuis le localStorage
 * Compatible avec le store auth (skyplay-auth)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem('skyplay-auth')
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored)
    
    // Le store peut contenir { state: { tokens: { idToken, accessToken } } }
    // ou directement { tokens: { idToken, accessToken } }
    const tokens = parsed?.state?.tokens || parsed?.tokens
    
    if (!tokens) {
      return null
    }

    // Préférer idToken pour l'API (utilisé par JwtStrategy Cognito)
    return tokens.idToken || tokens.accessToken || null
  } catch (error) {
    console.error('Error parsing auth token:', error)
    return null
  }
}
