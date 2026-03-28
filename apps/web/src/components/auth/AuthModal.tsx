'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

const GOOGLE_BUTTON =
  'flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/30 transition hover:scale-[1.01] hover:bg-slate-100 active:scale-[0.99]'

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

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const tokens = useAuthStore((state) => state.tokens)
  const isLoading = useAuthStore((state) => state.isLoading)
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)

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
      onClose()
    }
  }, [tokens, onClose])

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
                  <h2 className="text-2xl font-bold text-white">Connexion</h2>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={isLoading}
                  className={GOOGLE_BUTTON}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                  <span>Continuer avec Google</span>
                </button>

                <p className="text-center text-sm text-white/45">
                  D&apos;autres méthodes de connexion arrivent bientôt
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}