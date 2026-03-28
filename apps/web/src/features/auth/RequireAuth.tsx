'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const tokens = useAuthStore((s) => s.tokens)
  const [isHydrating, setIsHydrating] = useState(true)

  useEffect(() => {
    // Si on a des tokens, on est probablement authentifié
    // Pas besoin d'appeler hydrate() qui fait un appel API inutile
    if (tokens?.accessToken || tokens?.idToken) {
      setIsHydrating(false)
    } else {
      setIsHydrating(false)
    }
  }, [tokens])

  useEffect(() => {
    if (!isHydrating && !tokens) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
    }
  }, [tokens, router, pathname, isHydrating])

  // Afficher un loader pendant l'hydratation
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Chargement...</div>
      </div>
    )
  }

  if (!tokens) return null
  
  return <>{children}</>
}
