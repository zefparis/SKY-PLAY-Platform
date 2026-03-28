'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next') || '/dashboard'

  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const tokens = useAuthStore((s) => s.tokens)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (tokens) {
      router.replace(nextUrl)
    }
  }, [tokens, router, nextUrl])

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="max-w-md mx-auto">
            <Card variant="glass" className="p-6">
              <h1 className="title-tech text-2xl text-white font-extrabold mb-1">Connexion</h1>
              <p className="text-white/60 mb-6">Connectez-vous avec Google pour accéder à SkyPlay.</p>

              <div className="space-y-4">
                <Button type="button" onClick={() => loginWithGoogle()} className="w-full">
                  {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
                </Button>

                <p className="text-sm text-white/60">
                  Pas encore de compte ?{' '}
                  <a className="text-secondary hover:underline" href="/signup">
                    Découvrir l&apos;accès Google
                  </a>
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  )
}
