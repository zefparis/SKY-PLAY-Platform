'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

export default function AuthCallbackPage() {
  const handleOAuthCallback = useAuthStore((state) => state.handleOAuthCallback)
  const [error, setError] = useState<string | null>(null)
  const hasCalledRef = useRef(false)

  useEffect(() => {
    if (hasCalledRef.current) return
    hasCalledRef.current = true

    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    if (!code) {
      setError('Code OAuth manquant dans l\'URL')
      return
    }

    void handleOAuthCallback(code).catch((caughtError: unknown) => {
      if (caughtError instanceof Error) {
        setError(caughtError.message)
        return
      }

      setError('Erreur inconnue pendant la connexion Google')
    })
  }, [handleOAuthCallback])

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
