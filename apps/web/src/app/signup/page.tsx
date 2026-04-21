'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function SignupPage() {
  const { t } = useI18n()
  const router = useRouter()
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const tokens = useAuthStore((s) => s.tokens)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (tokens) {
      router.replace('/')
    }
  }, [tokens, router])

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="max-w-md mx-auto">
            <Card variant="glass" className="p-6">
              <h1 className="title-tech text-2xl text-white font-extrabold mb-1">{t('auth.signup')}</h1>
              <p className="text-white/60 mb-6">{t('signup.googleOnly')}</p>

              <div className="space-y-4">
                <Button type="button" onClick={() => loginWithGoogle()} className="w-full">
                  {isLoading ? t('signup.redirecting') : t('auth.continueGoogle')}
                </Button>

                <p className="text-sm text-white/60">
                  {t('auth.alreadyAccount')}{' '}
                  <a className="text-secondary hover:underline" href="/login">
                    {t('auth.signInBtn')}
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
