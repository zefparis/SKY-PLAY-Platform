'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/features/auth/auth.store'

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next') || '/dashboard'

  const login = useAuthStore((s) => s.login)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const isLoading = status === 'authenticating'

  const canSubmit = useMemo(() => {
    return email.length > 3 && password.length >= 6 && !isLoading
  }, [email, password, isLoading])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    try {
      await login({ email, password })
      router.replace(nextUrl)
    } catch (e: any) {
      setLocalError(e?.message || 'Identifiants invalides')
    }
  }

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="max-w-md mx-auto">
            <Card variant="glass" className="p-6">
              <h1 className="title-tech text-2xl text-white font-extrabold mb-1">Connexion</h1>
              <p className="text-white/60 mb-6">Accède à SKY PLAY avec ton compte.</p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Mot de passe</label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" />
                </div>

                {(localError || error) && (
                  <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    {localError || error}
                  </div>
                )}

                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {isLoading ? 'Connexion…' : 'Se connecter'}
                </Button>

                <div className="text-sm text-white/60">
                  Pas de compte ?{' '}
                  <a className="text-secondary hover:underline" href="/signup">
                    Créer un compte
                  </a>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-3">Social login (préparé)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" disabled className="w-full">
                      Google (bientôt)
                    </Button>
                    <Button type="button" variant="outline" disabled className="w-full">
                      Discord (bientôt)
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  )
}
