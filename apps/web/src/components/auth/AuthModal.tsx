'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Eye, EyeOff, Loader2, MailCheck, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  initialView?: ViewMode
}

type ViewMode = 'login' | 'signup' | 'confirm' | 'forgot' | 'reset'

const GOOGLE_BUTTON =
  'flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0097FC] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#0097FC]/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed'

const DISCORD_BUTTON =
  'flex w-full items-center justify-center gap-3 rounded-2xl bg-[#5865F2] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed'

const INPUT_CLASSNAME =
  'w-full rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-white px-4 py-3 text-sm dark:text-white text-[#00165F] outline-none transition dark:placeholder:text-white/35 placeholder:text-[#00165F]/40 focus:border-[#0097FC] focus:bg-white dark:focus:border-sky-400/70 dark:focus:bg-white/10'

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

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 71 55" fill="none" aria-hidden="true">
      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
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

const SEPARATOR = (
  <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-[0.24em] dark:text-white/35 text-[#00165F]/35">
    <div className="h-px flex-1 dark:bg-white/10 bg-[#00165F]/10" />
    <span>ou</span>
    <div className="h-px flex-1 dark:bg-white/10 bg-[#00165F]/10" />
  </div>
)

const VIEW_TITLES: Record<ViewMode, string> = {
  login: 'Connexion',
  signup: 'Créer un compte',
  confirm: 'Confirmer le compte',
  forgot: 'Mot de passe oublié',
  reset: 'Nouveau mot de passe',
}

export function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<ViewMode>(initialView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(Array.from({ length: 6 }, () => ''))
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const tokens = useAuthStore((state) => state.tokens)
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const confirmEmail = useAuthStore((state) => state.confirmEmail)
  const login = useAuthStore((state) => state.login)
  const signup = useAuthStore((state) => state.signup)
  const confirmSignup = useAuthStore((state) => state.confirmSignup)
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const loginWithDiscord = useAuthStore((state) => state.loginWithDiscord)
  const clearError = useAuthStore((state) => state.clearError)
  const setConfirmEmail = useAuthStore((state) => state.setConfirmEmail)

  const code = otpValues.join('')
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const newPasswordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const signupPasswordsMatch = password.length > 0 && password === confirmPassword

  const resetLocalState = () => {
    setEmail('')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setOtpValues(Array.from({ length: 6 }, () => ''))
    setSuccessMessage(null)
  }

  const switchView = (nextView: ViewMode) => {
    clearError()
    setSuccessMessage(null)
    setView(nextView)
    if (nextView !== 'confirm' && nextView !== 'reset') {
      setOtpValues(Array.from({ length: 6 }, () => ''))
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
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
      return
    }
    if (confirmEmail) {
      setView('confirm')
      setEmail(confirmEmail)
    } else {
      setView(initialView)
    }
  }, [isOpen, clearError, confirmEmail, initialView])

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

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await forgotPassword(email)
    setView('reset')
    setOtpValues(Array.from({ length: 6 }, () => ''))
  }

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await resetPassword(email, code, newPassword)
    setSuccessMessage('Mot de passe réinitialisé ! Connecte-toi.')
    switchView('login')
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
    if (!pastedCode) return
    event.preventDefault()
    const nextValues = Array.from({ length: 6 }, (_, index) => pastedCode[index] ?? '')
    setOtpValues(nextValues)
    otpRefs.current[Math.min(pastedCode.length, 5)]?.focus()
  }

  const canLogin = email.trim().length > 3 && password.length >= 6 && !isLoading
  const canSignup = email.trim().length > 3 && password.length >= 8 && confirmPassword.length >= 8 && signupPasswordsMatch && !isLoading
  const canConfirm = (confirmEmail ?? email).trim().length > 3 && code.length === 6 && !isLoading
  const canForgot = email.trim().length > 3 && !isLoading
  const canReset = code.length === 6 && newPassword.length >= 8 && !isLoading

  const OtpInput = ({ refs }: { refs: React.MutableRefObject<Array<HTMLInputElement | null>> }) => (
    <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
      {otpValues.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el }}
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          inputMode="numeric"
          maxLength={1}
          className="h-12 rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-white text-center text-lg font-semibold dark:text-white text-[#00165F] outline-none transition focus:border-[#0097FC] focus:bg-white dark:focus:border-sky-400/70 dark:focus:bg-white/10"
        />
      ))}
    </div>
  )

  const ErrorBox = () => error ? (
    <div className="rounded-2xl border dark:border-red-400/20 border-[#FD2E5F]/20 dark:bg-red-500/10 bg-[#FD2E5F]/10 px-4 py-3 text-sm dark:text-red-200 text-[#FD2E5F]">
      {error}
    </div>
  ) : null

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
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border dark:border-white/10 border-[#00165F]/15 dark:bg-[#071226] bg-white p-8 shadow-2xl dark:shadow-black/50 shadow-[#00165F]/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent dark:via-sky-400/70 via-[#0097FC]/50 to-transparent" />

              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 dark:text-white/50 text-[#00165F]/50 transition dark:hover:bg-white/5 hover:bg-[#00165F]/5 dark:hover:text-white hover:text-[#00165F]"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black text-white shadow-lg shadow-sky-500/30">
                  SP
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0097FC] dark:text-sky-300/80">SkyPlay</p>
                  <h2 className="text-2xl font-bold dark:text-white text-[#00165F]">{VIEW_TITLES[view]}</h2>
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {/* ── LOGIN ── */}
                {view === 'login' ? (
                  <motion.form key="login" className="space-y-4" onSubmit={handleLoginSubmit} {...viewTransition}>
                    <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE_BUTTON}>
                      <GoogleIcon />
                      <span>Continuer avec Google</span>
                    </button>

                    <button type="button" onClick={loginWithDiscord} disabled={isLoading} className={DISCORD_BUTTON}>
                      <DiscordIcon />
                      <span>Continuer avec Discord</span>
                    </button>

                    {SEPARATOR}

                    {successMessage ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 dark:text-emerald-300">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {successMessage}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT_CLASSNAME} placeholder="vous@exemple.com" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm dark:text-white/70 text-[#00165F]/70">Mot de passe</label>
                        <button type="button" onClick={() => switchView('forgot')} className="text-xs text-[#0097FC] dark:text-sky-300 hover:underline">
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <div className="relative">
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={`${INPUT_CLASSNAME} pr-12`} placeholder="Votre mot de passe" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 transition dark:hover:text-white hover:text-[#00165F]" aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <ErrorBox />

                    <button type="submit" disabled={!canLogin} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
                    </button>

                    <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                      Pas de compte ?{' '}
                      <button type="button" onClick={() => switchView('signup')} className="font-semibold text-[#0097FC] dark:text-sky-300 hover:text-[#00165F] dark:hover:text-sky-200 transition-colors">
                        S&apos;inscrire
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {/* ── SIGNUP ── */}
                {view === 'signup' ? (
                  <motion.form key="signup" className="space-y-4" onSubmit={handleSignupSubmit} {...viewTransition}>
                    <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE_BUTTON}>
                      <GoogleIcon />
                      <span>Continuer avec Google</span>
                    </button>

                    <button type="button" onClick={loginWithDiscord} disabled={isLoading} className={DISCORD_BUTTON}>
                      <DiscordIcon />
                      <span>Continuer avec Discord</span>
                    </button>

                    {SEPARATOR}

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT_CLASSNAME} placeholder="vous@exemple.com" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Mot de passe</label>
                      <div className="relative">
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT_CLASSNAME} pr-12`} placeholder="Créez un mot de passe" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 transition dark:hover:text-white hover:text-[#00165F]" aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {password.length > 0 ? (
                        <div className="space-y-1 rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between text-xs dark:text-white/60 text-[#00165F]/60">
                            <span>Force du mot de passe</span>
                            <span>{passwordStrength.label}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 4 }, (_, i) => (
                              <div key={i} className={`h-1.5 rounded-full ${i < passwordStrength.level ? passwordStrength.color : 'dark:bg-white/10 bg-[#00165F]/10'}`} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Confirmer le mot de passe</label>
                      <div className="relative">
                        <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT_CLASSNAME} pr-12`} placeholder="Répétez votre mot de passe" />
                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 transition dark:hover:text-white hover:text-[#00165F]" aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !signupPasswordsMatch ? (
                        <p className="text-xs text-[#FD2E5F] dark:text-red-200">Les mots de passe ne correspondent pas</p>
                      ) : null}
                    </div>

                    <ErrorBox />

                    <button type="submit" disabled={!canSignup} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer mon compte'}
                    </button>

                    <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                      Déjà un compte ?{' '}
                      <button type="button" onClick={() => switchView('login')} className="font-semibold text-[#0097FC] dark:text-sky-300 hover:text-[#00165F] dark:hover:text-sky-200 transition-colors">
                        Se connecter
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {/* ── CONFIRM ── */}
                {view === 'confirm' ? (
                  <motion.form key="confirm" className="space-y-5" onSubmit={handleConfirmSubmit} {...viewTransition}>
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-center">
                      <MailCheck className="mx-auto mb-3 h-6 w-6 text-[#0097FC] dark:text-sky-300" />
                      <p className="text-sm font-medium dark:text-white text-[#00165F]">Code envoyé à</p>
                      <p className="mt-1 text-sm font-semibold dark:text-white text-[#00165F]">{confirmEmail ?? email}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Code de confirmation (6 chiffres)</label>
                      <OtpInput refs={otpRefs} />
                    </div>

                    <ErrorBox />

                    <button type="submit" disabled={!canConfirm} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                    </button>

                    <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                      <button type="button" onClick={() => { setConfirmEmail(null); switchView('signup') }} className="font-semibold text-[#0097FC] dark:text-sky-300 hover:text-[#00165F] dark:hover:text-sky-200 transition-colors">
                        Retour
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {/* ── FORGOT ── */}
                {view === 'forgot' ? (
                  <motion.form key="forgot" className="space-y-4" onSubmit={handleForgotSubmit} {...viewTransition}>
                    <p className="text-sm dark:text-white/60 text-[#00165F]/60">
                      Saisis ton adresse email et nous t&apos;enverrons un code pour réinitialiser ton mot de passe.
                    </p>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT_CLASSNAME} placeholder="vous@exemple.com" />
                    </div>

                    <ErrorBox />

                    <button type="submit" disabled={!canForgot} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer le code'}
                    </button>

                    <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                      <button type="button" onClick={() => switchView('login')} className="font-semibold text-[#0097FC] dark:text-sky-300 hover:text-[#00165F] dark:hover:text-sky-200 transition-colors">
                        ← Retour à la connexion
                      </button>
                    </p>
                  </motion.form>
                ) : null}

                {/* ── RESET ── */}
                {view === 'reset' ? (
                  <motion.form key="reset" className="space-y-4" onSubmit={handleResetSubmit} {...viewTransition}>
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-center">
                      <MailCheck className="mx-auto mb-2 h-5 w-5 text-[#0097FC] dark:text-sky-300" />
                      <p className="text-sm dark:text-white/70 text-[#00165F]/70">Code envoyé à <span className="font-semibold dark:text-white text-[#00165F]">{email}</span></p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Code reçu par email</label>
                      <OtpInput refs={otpRefs} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm dark:text-white/70 text-[#00165F]/70">Nouveau mot de passe</label>
                      <div className="relative">
                        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT_CLASSNAME} pr-12`} placeholder="Nouveau mot de passe" />
                        <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 transition dark:hover:text-white hover:text-[#00165F]" aria-label={showNewPassword ? 'Masquer' : 'Afficher'}>
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className={`h-1.5 rounded-full ${i < newPasswordStrength.level ? newPasswordStrength.color : 'dark:bg-white/10 bg-[#00165F]/10'}`} />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <ErrorBox />

                    <button type="submit" disabled={!canReset} className={PRIMARY_BUTTON}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réinitialiser le mot de passe'}
                    </button>

                    <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                      <button type="button" onClick={() => switchView('forgot')} className="font-semibold text-[#0097FC] dark:text-sky-300 hover:text-[#00165F] dark:hover:text-sky-200 transition-colors">
                        ← Retour
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