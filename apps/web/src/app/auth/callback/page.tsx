'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/auth.store'
import { getOAuthRedirectUri } from '@/lib/oauth'

type TokenResponse = {
  access_token: string
  id_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const handleOAuthCallback = useAuthStore((s) => s.handleOAuthCallback)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const domain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN
        const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
        const redirectUri = getOAuthRedirectUri()

        if (!domain || !clientId) {
          throw new Error(
            'Configuration manquante: NEXT_PUBLIC_AWS_COGNITO_DOMAIN / NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID / NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN'
          )
        }

        // Lire le code OAuth depuis l'URL
        const sp = new URLSearchParams(window.location.search)
        const code = sp.get('code')
        
        if (!code) {
          throw new Error('Code OAuth manquant dans l\'URL')
        }

        // Échanger le code contre des tokens
        const tokenEndpoint = `${domain.replace(/\/+$/, '')}/oauth2/token`
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
        })

        const tokenRes = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        })

        if (!tokenRes.ok) {
          const txt = await tokenRes.text().catch(() => '')
          throw new Error(`Échec échange token (${tokenRes.status}): ${txt || tokenRes.statusText}`)
        }

        const tokenJson = (await tokenRes.json()) as TokenResponse

        // Utiliser le store pour gérer les tokens et sync avec l'API
        await handleOAuthCallback({
          accessToken: tokenJson.access_token,
          idToken: tokenJson.id_token,
          refreshToken: tokenJson.refresh_token || '',
        })

        // Redirection après succès
        router.replace('/')
      } catch (e: any) {
        setError(e?.message || 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [handleOAuthCallback, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        Connexion en cours…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0a0f1e]/95 p-6 text-white">
          <h1 className="text-xl font-bold mb-2">Erreur de connexion</h1>
          <p className="text-sm text-white/70 mb-4">{error}</p>
          <Link className="text-sky-400 hover:text-sky-300" href="/login">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return null
}
