'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/components/i18n/I18nProvider'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type ViewMode = 'login' | 'signup' | 'confirm' | 'forgot' | 'reset'

const INPUT =
  'w-full rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-white px-4 py-3 text-sm dark:text-white text-[#00165F] outline-none transition dark:placeholder:text-white/35 placeholder:text-[#00165F]/40 focus:border-[#0097FC] dark:focus:border-sky-400/70'

const PRIMARY =
  'flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed'

const GOOGLE =
  'flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0097FC] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#0097FC]/30 transition hover:brightness-110 disabled:opacity-60'

const LINK = 'font-semibold text-[#0097FC] dark:text-sky-300 hover:underline transition-colors'

const vt = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.18, ease: 'easeOut' },
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

function getPasswordStrength(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  if (s <= 1) return { labelKey: 'auth.strength.weak', level: 1, color: 'bg-red-400' }
  if (s === 2) return { labelKey: 'auth.strength.fair', level: 2, color: 'bg-amber-400' }
  if (s === 3) return { labelKey: 'auth.strength.good', level: 3, color: 'bg-lime-400' }
  return { labelKey: 'auth.strength.strong', level: 4, color: 'bg-emerald-400' }
}

export default function LoginClient() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next') || '/dashboard'

  const [view, setView] = useState<ViewMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const tokens = useAuthStore((s) => s.tokens)
  const error = useAuthStore((s) => s.error)
  const isLoading = useAuthStore((s) => s.isLoading)
  const confirmEmail = useAuthStore((s) => s.confirmEmail)
  const login = useAuthStore((s) => s.login)
  const signup = useAuthStore((s) => s.signup)
  const confirmSignup = useAuthStore((s) => s.confirmSignup)
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const clearError = useAuthStore((s) => s.clearError)
  const setConfirmEmail = useAuthStore((s) => s.setConfirmEmail)

  const VIEW_TITLES: Record<ViewMode, string> = {
    login: t('auth.login'),
    signup: t('auth.signup'),
    confirm: t('auth.confirm'),
    forgot: t('auth.forgot'),
    reset: t('auth.reset'),
  }

  const code = otp.join('')
  const pwdStrength = useMemo(() => getPasswordStrength(password), [password])
  const newPwdStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const pwdMatch = password.length > 0 && password === confirmPassword

  useEffect(() => {
    if (tokens) router.replace(nextUrl)
  }, [tokens, router, nextUrl])

  useEffect(() => {
    if (confirmEmail) {
      setEmail(confirmEmail)
      setView('confirm')
    }
  }, [confirmEmail])

  const switchView = (v: ViewMode) => {
    clearError()
    setSuccessMsg(null)
    setView(v)
    if (v !== 'confirm' && v !== 'reset') setOtp(Array(6).fill(''))
  }

  const handleOtpChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[i] = ch; setOtp(next)
    if (ch && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    e.preventDefault()
    const next = Array.from({ length: 6 }, (_, i) => digits[i] ?? '')
    setOtp(next)
    otpRefs.current[Math.min(digits.length, 5)]?.focus()
  }

  const OtpRow = () => (
    <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
      {otp.map((d, i) => (
        <input key={i} ref={el => { otpRefs.current[i] = el }} value={d}
          onChange={e => handleOtpChange(i, e.target.value)}
          onKeyDown={e => handleOtpKey(i, e)}
          inputMode="numeric" maxLength={1}
          className="h-12 rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-white text-center text-lg font-semibold dark:text-white text-[#00165F] outline-none transition focus:border-[#0097FC] dark:focus:border-sky-400/70"
        />
      ))}
    </div>
  )

  const ErrorBox = () => error ? (
    <div className="rounded-2xl border border-[#FD2E5F]/20 bg-[#FD2E5F]/10 dark:border-red-400/20 dark:bg-red-500/10 px-4 py-3 text-sm text-[#FD2E5F] dark:text-red-200">{error}</div>
  ) : null

  const SEPARATOR = (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] dark:text-white/35 text-[#00165F]/35">
      <div className="h-px flex-1 dark:bg-white/10 bg-[#00165F]/10" /><span>{t('auth.or')}</span><div className="h-px flex-1 dark:bg-white/10 bg-[#00165F]/10" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-3xl border dark:border-white/10 border-[#00165F]/15 dark:bg-[#071226] bg-white p-8 shadow-2xl dark:shadow-black/50 shadow-[#00165F]/20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent dark:via-sky-400/70 via-[#0097FC]/50 to-transparent" />

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black text-white shadow-lg shadow-sky-500/30">SP</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0097FC] dark:text-sky-300/80">SkyPlay</p>
              <h1 className="text-2xl font-bold dark:text-white text-[#00165F]">{VIEW_TITLES[view]}</h1>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* ── LOGIN ── */}
            {view === 'login' ? (
              <motion.form key="login" className="space-y-4" onSubmit={async e => { e.preventDefault(); await login(email, password) }} {...vt}>
                <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE}>
                  <GoogleIcon /><span>{t('auth.continueGoogle')}</span>
                </button>
                {SEPARATOR}
                {successMsg ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4 shrink-0" />{successMsg}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.email')}</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT} placeholder={t('auth.emailPlaceholder')} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.password')}</label>
                    <button type="button" onClick={() => switchView('forgot')} className="text-xs text-[#0097FC] dark:text-sky-300 hover:underline">{t('auth.forgotPassword')}</button>
                  </div>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} autoComplete="current-password" className={`${INPUT} pr-12`} placeholder={t('auth.passwordPlaceholder')} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 hover:text-[#00165F] dark:hover:text-white">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <ErrorBox />
                <button type="submit" disabled={email.trim().length < 4 || password.length < 6 || isLoading} className={PRIMARY}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.signInBtn')}
                </button>
                <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                  {t('auth.noAccount')}{' '}<button type="button" onClick={() => switchView('signup')} className={LINK}>{t('auth.register')}</button>
                </p>
              </motion.form>
            ) : null}

            {/* ── SIGNUP ── */}
            {view === 'signup' ? (
              <motion.form key="signup" className="space-y-4" onSubmit={async e => {
                e.preventDefault()
                await signup(email, password)
                setConfirmEmail(email)
                setView('confirm')
                setOtp(Array(6).fill(''))
              }} {...vt}>
                <button type="button" onClick={loginWithGoogle} disabled={isLoading} className={GOOGLE}>
                  <GoogleIcon /><span>{t('auth.continueGoogle')}</span>
                </button>
                {SEPARATOR}
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.email')}</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT} placeholder={t('auth.emailPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.password')}</label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT} pr-12`} placeholder={t('auth.createPassword')} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 hover:text-[#00165F] dark:hover:text-white">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 ? (
                    <div className="rounded-2xl border dark:border-white/10 border-[#00165F]/20 dark:bg-white/5 bg-slate-50 px-4 py-3 space-y-1">
                      <div className="flex justify-between text-xs dark:text-white/60 text-[#00165F]/60"><span>{t('auth.strength.label')}</span><span>{t(pwdStrength.labelKey)}</span></div>
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-1.5 rounded-full ${i < pwdStrength.level ? pwdStrength.color : 'dark:bg-white/10 bg-[#00165F]/10'}`} />)}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.confirmPassword')}</label>
                  <div className="relative">
                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showConfirmPwd ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT} pr-12`} placeholder={t('auth.confirmPasswordPlaceholder')} />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 hover:text-[#00165F] dark:hover:text-white">
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !pwdMatch ? <p className="text-xs text-[#FD2E5F] dark:text-red-200">{t('auth.passwordMismatch')}</p> : null}
                </div>
                <ErrorBox />
                <button type="submit" disabled={email.trim().length < 4 || password.length < 8 || !pwdMatch || isLoading} className={PRIMARY}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.createAccountBtn')}
                </button>
                <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                  {t('auth.alreadyAccount')}{' '}<button type="button" onClick={() => switchView('login')} className={LINK}>{t('auth.signInBtn')}</button>
                </p>
              </motion.form>
            ) : null}

            {/* ── CONFIRM ── */}
            {view === 'confirm' ? (
              <motion.form key="confirm" className="space-y-5" onSubmit={async e => {
                e.preventDefault()
                await confirmSignup(confirmEmail ?? email, code, password || undefined)
              }} {...vt}>
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-center">
                  <MailCheck className="mx-auto mb-2 h-6 w-6 text-[#0097FC] dark:text-sky-300" />
                  <p className="text-sm font-medium dark:text-white text-[#00165F]">{t('auth.codeSentTo')}</p>
                  <p className="text-sm font-semibold dark:text-white text-[#00165F]">{confirmEmail ?? email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.confirmationCode')}</label>
                  <OtpRow />
                </div>
                <ErrorBox />
                <button type="submit" disabled={(confirmEmail ?? email).trim().length < 4 || code.length < 6 || isLoading} className={PRIMARY}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.confirmBtn')}
                </button>
                <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                  <button type="button" onClick={() => { setConfirmEmail(null); switchView('signup') }} className={LINK}>{t('auth.back')}</button>
                </p>
              </motion.form>
            ) : null}

            {/* ── FORGOT ── */}
            {view === 'forgot' ? (
              <motion.form key="forgot" className="space-y-4" onSubmit={async e => {
                e.preventDefault()
                await forgotPassword(email)
                setView('reset')
                setOtp(Array(6).fill(''))
              }} {...vt}>
                <p className="text-sm dark:text-white/60 text-[#00165F]/60">{t('auth.forgotDesc')}</p>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.email')}</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" className={INPUT} placeholder={t('auth.emailPlaceholder')} />
                </div>
                <ErrorBox />
                <button type="submit" disabled={email.trim().length < 4 || isLoading} className={PRIMARY}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.sendCode')}
                </button>
                <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                  <button type="button" onClick={() => switchView('login')} className={LINK}>{t('auth.backToLogin')}</button>
                </p>
              </motion.form>
            ) : null}

            {/* ── RESET ── */}
            {view === 'reset' ? (
              <motion.form key="reset" className="space-y-4" onSubmit={async e => {
                e.preventDefault()
                await resetPassword(email, code, newPassword)
                setSuccessMsg(t('auth.resetSuccess'))
                switchView('login')
              }} {...vt}>
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-center">
                  <MailCheck className="mx-auto mb-2 h-5 w-5 text-[#0097FC] dark:text-sky-300" />
                  <p className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.codeSentTo')} <span className="font-semibold dark:text-white text-[#00165F]">{email}</span></p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.codeReceivedByEmail')}</label>
                  <OtpRow />
                </div>
                <div className="space-y-2">
                  <label className="text-sm dark:text-white/70 text-[#00165F]/70">{t('auth.newPassword')}</label>
                  <div className="relative">
                    <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showNewPwd ? 'text' : 'password'} autoComplete="new-password" className={`${INPUT} pr-12`} placeholder={t('auth.newPasswordPlaceholder')} />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/50 text-[#00165F]/50 hover:text-[#00165F] dark:hover:text-white">
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-1.5 rounded-full ${i < newPwdStrength.level ? newPwdStrength.color : 'dark:bg-white/10 bg-[#00165F]/10'}`} />)}
                    </div>
                  ) : null}
                </div>
                <ErrorBox />
                <button type="submit" disabled={code.length < 6 || newPassword.length < 8 || isLoading} className={PRIMARY}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.resetBtn')}
                </button>
                <p className="text-center text-sm dark:text-white/55 text-[#00165F]/60">
                  <button type="button" onClick={() => switchView('forgot')} className={LINK}>{t('auth.back')}</button>
                </p>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
