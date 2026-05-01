'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function YouTubeCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      router.replace('/profile?youtube=error&reason=access_denied')
      return
    }

    if (!code || !state) {
      router.replace('/profile?youtube=error&reason=missing_params')
      return
    }

    ;(async () => {
      try {
        const url = `${API}/streaming/youtube/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        const res = await fetch(url, { credentials: 'include' })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const reason = (body as { reason?: string }).reason ?? 'exchange_failed'
          router.replace(`/profile?youtube=error&reason=${reason}`)
          return
        }

        router.replace('/profile?youtube=linked')
      } catch {
        router.replace('/profile?youtube=error&reason=exchange_failed')
      }
    })()
  }, [searchParams, router])

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
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#0097FC] animate-spin" />
        <h2 className="text-xl font-bold dark:text-white text-[#00165F] mb-2">Connexion YouTube</h2>
        <p className="dark:text-white/60 text-[#00165F]/60">Connexion YouTube en cours...</p>
      </div>
    </div>
  )
}

export default function YouTubeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-[#030b1a] bg-[#f0f4ff]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#0097FC] animate-spin" />
          <h2 className="text-xl font-bold dark:text-white text-[#00165F] mb-2">Chargement...</h2>
        </div>
      </div>
    }>
      <YouTubeCallbackContent />
    </Suspense>
  )
}
