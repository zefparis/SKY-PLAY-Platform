'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Loader2 } from 'lucide-react'

function DiscordCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handleDiscordCallback = useAuthStore((s) => s.handleDiscordCallback)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('Authentification Discord annulée')
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    if (!code) {
      setError('Code Discord manquant')
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    handleDiscordCallback(code).catch((err) => {
      console.error('Discord callback error:', err)
      setError(err.message || 'Erreur lors de l\'authentification Discord')
      setTimeout(() => router.push('/login'), 3000)
    })
  }, [searchParams, handleDiscordCallback, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#030b1a] bg-[#f0f4ff]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold dark:text-white text-[#00165F] mb-2">Erreur</h2>
          <p className="dark:text-white/60 text-[#00165F]/60">{error}</p>
          <p className="text-sm dark:text-white/40 text-[#00165F]/40 mt-2">Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#030b1a] bg-[#f0f4ff]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 dark:text-[#0097FC] text-[#0097FC] animate-spin" />
        <h2 className="text-xl font-bold dark:text-white text-[#00165F] mb-2">Connexion avec Discord</h2>
        <p className="dark:text-white/60 text-[#00165F]/60">Authentification en cours...</p>
      </div>
    </div>
  )
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-[#030b1a] bg-[#f0f4ff]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 dark:text-[#0097FC] text-[#0097FC] animate-spin" />
          <h2 className="text-xl font-bold dark:text-white text-[#00165F] mb-2">Chargement...</h2>
        </div>
      </div>
    }>
      <DiscordCallbackContent />
    </Suspense>
  )
}
