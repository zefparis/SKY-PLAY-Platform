'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/features/auth/auth.store'
import { AUTH_COPY } from '@/lib/auth-copy'

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next') || '/dashboard'

  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const signupStep = useAuthStore((s) => s.signupStep)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Reset form fields when component mounts
  useEffect(() => {
    setEmail('')
    setPassword('')
    setLocalError(null)
    setShowPassword(false)
  }, [])

  const isLoading = status === 'authenticating'

  const canSubmit = useMemo(() => {
    return email.length >= 3 && password.length >= 6 && !isLoading
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
              <h1 className="title-tech text-2xl text-white font-extrabold mb-1">{AUTH_COPY.login.title}</h1>
              <p className="text-white/60 mb-6">{AUTH_COPY.login.subtitle}</p>

              {signupStep === 'pending' && (
                <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-4">
                  {AUTH_COPY.signup.confirmSubtitle}
                  <div className="mt-2">
                    <a className="text-secondary hover:underline" href="/signup?step=confirm">
                      {AUTH_COPY.signup.confirmTitle}
                    </a>
                  </div>
                </div>
              )}

              {signupStep === 'confirmed' && (
                <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 mb-4">
                  {AUTH_COPY.signup.confirmed}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">{AUTH_COPY.login.emailLabel}</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">{AUTH_COPY.login.passwordLabel}</label>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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

                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {isLoading ? AUTH_COPY.login.submitLoading : AUTH_COPY.login.submit}
                </Button>

                <div className="text-sm text-white/60">
                  {AUTH_COPY.login.noAccount}{' '}
                  <a className="text-secondary hover:underline" href="/signup">
                    {AUTH_COPY.login.createAccount}
                  </a>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-3">{AUTH_COPY.login.socialTitle}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => loginWithGoogle()}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button type="button" variant="outline" disabled className="w-full">
                      {AUTH_COPY.login.discordSoon}
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
