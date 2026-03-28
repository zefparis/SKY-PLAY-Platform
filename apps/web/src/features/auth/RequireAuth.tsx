'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/features/auth/auth.store'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const status = useAuthStore((s) => s.status)
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
    // Ne rediriger que si on a fini l'hydratation ET qu'on est anonymous
    if (!isHydrating && status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
    }
  }, [status, router, pathname, isHydrating])

  // Afficher un loader pendant l'hydratation
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Chargement...</div>
      </div>
    )
  }

  // Si pas authentifié après hydratation, ne rien afficher (redirection en cours)
  if (status !== 'authenticated') return null
  
  return <>{children}</>
}
