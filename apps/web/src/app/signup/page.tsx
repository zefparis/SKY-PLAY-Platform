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
  const [showPassword, setShowPassword] = useState(false)

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
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none"
                    >
                      {showPassword ? (
                        // Icône œil barré
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.306.835-2.417 2.197-3.197M6.13 6.13A9.956 9.956 0 0112 5c5 0 9 4.03 9 7 0 1.306-.835 2.417-2.197 3.197M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" />
                        </svg>
                      ) : (
                        // Icône œil ouvert
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7 0c0 3-4 7-10 7S2 15 2 12s4-7 10-7 10 4 10 7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
