'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/features/auth/auth.store'

export default function SignupPage() {
  const router = useRouter()
  const signup = useAuthStore((s) => s.signup)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isLoading = status === 'authenticating'
  const canSubmit = useMemo(() => {
    return email.length > 3 && password.length >= 6 && username.length >= 3 && !isLoading
  }, [email, password, username, isLoading])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccess(null)
    try {
      await signup({ email, password, username })
      setSuccess(
        "Compte créé. Selon la configuration Cognito, tu devras peut-être confirmer ton email avant de te connecter."
      )
      setTimeout(() => router.push('/login'), 700)
    } catch (e: any) {
      setLocalError(e?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="max-w-md mx-auto">
            <Card variant="glass" className="p-6">
              <h1 className="title-tech text-2xl text-white font-extrabold mb-1">Créer un compte</h1>
              <p className="text-white/60 mb-6">Rejoins les challenges et gagne des rewards.</p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Mot de passe</label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" />
                </div>

                {(localError || error) && (
                  <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    {localError || error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                    {success}
                  </div>
                )}

                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {isLoading ? 'Création…' : 'Créer mon compte'}
                </Button>

                <div className="text-sm text-white/60">
                  Déjà un compte ?{' '}
                  <a className="text-secondary hover:underline" href="/login">
                    Se connecter
                  </a>
                </div>
              </form>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  )
}
