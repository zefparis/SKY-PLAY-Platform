'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

export default function AuthCallbackPage() {
  const handleOAuthCallback = useAuthStore((state) => state.handleOAuthCallback)
  const [error, setError] = useState<string | null>(null)
  const hasCalledRef = useRef(false)
  const callbackRef = useRef(handleOAuthCallback)

  useEffect(() => {
    if (hasCalledRef.current) return
    hasCalledRef.current = true

    const searchParams = new URLSearchParams(window.location.search)

    // 1. Check if the provider returned an error
    const oauthError = searchParams.get('error')
    if (oauthError) {
      const desc = searchParams.get('error_description')
      const friendly: Record<string, string> = {
        access_denied: 'Vous avez refusé l\u2019autorisation Google.',
        invalid_request: 'Requête invalide — réessayez la connexion.',
        server_error: 'Erreur côté Google — réessayez dans quelques instants.',
      }
      setError(friendly[oauthError] ?? desc ?? `Erreur OAuth : ${oauthError}`)
      return
    }

    // 2. Validate state (CSRF protection)
    const urlState = searchParams.get('state')
    const storedState = localStorage.getItem('skyplay-pkce-state')

    if (!urlState || !storedState || urlState !== storedState) {
      setError('Session invalide ou expirée — relance la connexion Google.')
      return
    }

    // 3. Check code presence
    const code = searchParams.get('code')
    if (!code) {
      setError('Session expirée — relance la connexion.')
      return
    }

    void callbackRef.current(code).catch((caughtError: unknown) => {
      if (caughtError instanceof Error) {
        setError(caughtError.message)
        return
      }

      setError('Erreur inconnue pendant la connexion Google')
    })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#071226] p-8 text-white shadow-2xl shadow-black/40">
          <h1 className="mb-3 text-2xl font-bold">Erreur de connexion</h1>
          <p className="mb-6 text-sm text-white/65">{error}</p>
          <Link href="/login" className="text-sm font-semibold text-sky-400 transition hover:text-sky-300">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020817] px-6 text-white">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-[#071226] p-8 text-center shadow-2xl shadow-black/40">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-sky-400" />
        <h1 className="text-2xl font-bold">Connexion en cours</h1>
        <p className="mt-2 text-sm text-white/60">Finalisation de votre connexion Google...</p>
      </div>
    </div>
  )
}
