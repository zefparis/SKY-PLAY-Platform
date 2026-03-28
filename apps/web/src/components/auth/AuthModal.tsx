'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, MailCheck, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'login' | 'signup' | 'confirm'

const GOOGLE_BUTTON =
  'flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/30 transition hover:scale-[1.01] hover:bg-slate-100 active:scale-[0.99]'

const INPUT_CLASSNAME =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-sky-400/70 focus:bg-white/10'

const PRIMARY_BUTTON =
  'flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'

const viewTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.847 32.659 29.303 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.338 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.185 35.091 26.715 36 24 36c-5.283 0-9.82-3.324-11.29-7.957l-6.52 5.02C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.706 2.058-2.02 3.8-3.784 5.07l.003-.002 6.19 5.238C36.4 39.5 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

function getPasswordStrength(password: string): { label: string; level: number; color: string } {
  let score = 0

  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Faible', level: 1, color: 'bg-red-400' }
  if (score === 2) return { label: 'Moyen', level: 2, color: 'bg-amber-400' }
  if (score === 3) return { label: 'Bon', level: 3, color: 'bg-lime-400' }
  return { label: 'Fort', level: 4, color: 'bg-emerald-400' }
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<ViewMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(Array.from({ length: 6 }, () => ''))
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const tokens = useAuthStore((state) => state.tokens)
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const confirmEmail = useAuthStore((state) => state.confirmEmail)
  const login = useAuthStore((state) => state.login)
  const signup = useAuthStore((state) => state.signup)
  const confirmSignup = useAuthStore((state) => state.confirmSignup)
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const clearError = useAuthStore((state) => state.clearError)
  const setConfirmEmail = useAuthStore((state) => state.setConfirmEmail)

  const code = otpValues.join('')
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const signupPasswordsMatch = password.length > 0 && password === confirmPassword

  const resetLocalState = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setOtpValues(Array.from({ length: 6 }, () => ''))
  }

  const switchView = (nextView: ViewMode) => {
    clearError()
    setView(nextView)
    if (nextView !== 'confirm') {
      setOtpValues(Array.from({ length: 6 }, () => ''))
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (tokens) {
      resetLocalState()
      onClose()
    }
  }, [tokens, onClose])

  useEffect(() => {
    if (!isOpen) {
      clearError()
      resetLocalState()
      setView(confirmEmail ? 'confirm' : 'login')
      return
    }

    setView(confirmEmail ? 'confirm' : 'login')
    if (confirmEmail) {
      setEmail(confirmEmail)
    }
  }, [isOpen, clearError, confirmEmail])

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await login(email, password)
  }

  const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await signup(email, password)
    setConfirmEmail(email)
    setView('confirm')
    setOtpValues(Array.from({ length: 6 }, () => ''))
  }

  const handleConfirmSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const emailToConfirm = confirmEmail ?? email
    await confirmSignup(emailToConfirm, code, password || undefined)
  }

  const handleOtpChange = (index: number, value: string) => {
    const nextChar = value.replace(/\D/g, '').slice(-1)
    const nextValues = [...otpValues]
    nextValues[index] = nextChar
    setOtpValues(nextValues)

    if (nextChar && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    if (event.key === 'ArrowRight' && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedCode) {
      return
    }

    event.preventDefault()
    const nextValues = Array.from({ length: 6 }, (_, index) => pastedCode[index] ?? '')
    setOtpValues(nextValues)
    otpRefs.current[Math.min(pastedCode.length, 5)]?.focus()
  }

  const canLogin = email.trim().length > 3 && password.length >= 6 && !isLoading
  const canSignup =
    email.trim().length > 3 && password.length >= 8 && confirmPassword.length >= 8 && signupPasswordsMatch && !isLoading
  const canConfirm = (confirmEmail ?? email).trim().length > 3 && code.length === 6 && !isLoading

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#071226] p-8 shadow-2xl shadow-black/50"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black text-white shadow-lg shadow-sky-500/30">
                  SP
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">SkyPlay</p>
                  <h2 className="text-2xl font-bold text-white">
                    {view === 'login' ? 'Connexion' : view === 'signup' ? 'Créer un compte' : 'Confirmer le compte'}
                  </h2>
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {view === 'login' ? (
                  <motion.form key="login" className="space-y-4" onSubmit={handleLoginSubmit} {...viewTransition}>
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Email</label>
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        autoComplete="email"
                        className={INPUT_CLASSNAME}
                        placeholder="vous@exemple.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Mot de passe</label>
                      <div className="relative">
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          className={`${INPUT_CLASSNAME} pr-12`}
                          placeholder="Votre mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}

                    <button type="submit" disabled={!canLogin} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
                    </button>

                    <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-[0.24em] text-white/35">
                      <div className="h-px flex-1 bg-white/10" />
                      <span>ou</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      <span>Continuer avec Google</span>
                    </button>

                    <p className="text-center text-sm text-white/55">
                      Pas de compte ?{' '}
                      <button type="button" onClick={() => switchView('signup')} className="font-semibold text-sky-300 hover:text-sky-200">
                        S&apos;inscrire
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {view === 'signup' ? (
                  <motion.form key="signup" className="space-y-4" onSubmit={handleSignupSubmit} {...viewTransition}>
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Email</label>
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        autoComplete="email"
                        className={INPUT_CLASSNAME}
                        placeholder="vous@exemple.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Mot de passe</label>
                      <div className="relative">
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`${INPUT_CLASSNAME} pr-12`}
                          placeholder="Créez un mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Force du mot de passe</span>
                          <span>{passwordStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 4 }, (_, index) => (
                            <div
                              key={index}
                              className={`h-1.5 rounded-full ${index < passwordStrength.level ? passwordStrength.color : 'bg-white/10'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`${INPUT_CLASSNAME} pr-12`}
                          placeholder="Répétez votre mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                          aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !signupPasswordsMatch ? (
                        <p className="text-xs text-red-200">Les mots de passe ne correspondent pas</p>
                      ) : null}
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}

                    <button type="submit" disabled={!canSignup} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer mon compte'}
                    </button>

                    <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-[0.24em] text-white/35">
                      <div className="h-px flex-1 bg-white/10" />
                      <span>ou</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      <span>Continuer avec Google</span>
                    </button>

                    <p className="text-center text-sm text-white/55">
                      Déjà un compte ?{' '}
                      <button type="button" onClick={() => switchView('login')} className="font-semibold text-sky-300 hover:text-sky-200">
                        Se connecter
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {view === 'confirm' ? (
                  <motion.form key="confirm" className="space-y-5" onSubmit={handleConfirmSubmit} {...viewTransition}>
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-center">
                      <MailCheck className="mx-auto mb-3 h-6 w-6 text-sky-300" />
                      <p className="text-sm font-medium text-white">Vérifie ta boîte mail</p>
                      <p className="mt-1 text-sm text-white/60">Entre le code reçu sur <span className="font-semibold text-white">{confirmEmail ?? email}</span>.</p>
                    </div>

                    <div className="space-y-2" onPaste={handleOtpPaste}>
                      <label className="text-sm text-white/70">Code de confirmation</label>
                      <div className="grid grid-cols-6 gap-2">
                        {otpValues.map((digit, index) => (
                          <input
                            key={index}
                            ref={(element) => {
                              otpRefs.current[index] = element
                            }}
                            value={digit}
                            onChange={(event) => handleOtpChange(index, event.target.value)}
                            onKeyDown={(event) => handleOtpKeyDown(index, event)}
                            inputMode="numeric"
                            maxLength={1}
                            className="h-12 rounded-2xl border border-white/10 bg-white/5 text-center text-lg font-semibold text-white outline-none transition focus:border-sky-400/70 focus:bg-white/10"
                          />
                        ))}
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}

                    <button type="submit" disabled={!canConfirm} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                    </button>

                    <p className="text-center text-sm text-white/55">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmEmail(null)
                          switchView('signup')
                        }}
                        className="font-semibold text-sky-300 hover:text-sky-200"
                      >
                        Retour
                      </button>
                    </p>
                  </motion.form>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}