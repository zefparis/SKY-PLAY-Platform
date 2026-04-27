'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Moon, Sun, Bell, Shield, Trash2, KeyRound, X, Check } from 'lucide-react'
import Container from '@/components/ui/Container'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useAuthStore } from '@/lib/auth-store'

const COGNITO_DOMAIN = 'https://eu-west-1sznqqakay.auth.eu-west-1.amazoncognito.com'
const COGNITO_CLIENT_ID = '5f29473pmgndvnqlavstf8abnu'
const COGNITO_REDIRECT = 'https://sky-play-platform.vercel.app/auth/callback'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://skyplayapi-production.up.railway.app'

const NOTIF_KEY = 'skyplay.notif.prefs'

type NotifPrefs = {
  challenges: boolean
  tournaments: boolean
  friends: boolean
  system: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  challenges: true,
  tournaments: true,
  friends: true,
  system: true,
}

const NOTIF_ITEMS: Array<{ key: keyof NotifPrefs; label: string; desc: string; emoji: string }> = [
  { key: 'challenges', label: 'Défis', desc: 'Invitations, résultats, gains', emoji: '⚔️' },
  { key: 'tournaments', label: 'Tournois', desc: 'Phases, brackets, classements', emoji: '🏆' },
  { key: 'friends', label: 'Amis', desc: 'Demandes, messages privés, vocal', emoji: '👥' },
  { key: 'system', label: 'Système', desc: 'Annonces, KYC, sécurité', emoji: '🔔' },
]

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#0097FC]/15 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-[#0097FC]" />
        </div>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Toggle pill ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-[#0097FC]' : 'bg-white/15'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow"
        style={{ marginLeft: checked ? 22 : 2 }}
      />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter()
  const { lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const tokens = useAuthStore((s) => s.tokens)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [mounted, setMounted] = useState(false)
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Auth gate
  useEffect(() => {
    if (mounted && !tokens) router.push('/')
  }, [mounted, tokens, router])

  // Load notification prefs
  useEffect(() => {
    if (!mounted) return
    try {
      const raw = localStorage.getItem(NOTIF_KEY)
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch {}
  }, [mounted])

  const updatePref = (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch {}
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  // ── Password change → Cognito hosted UI (forgot password flow) ─────────────
  const handleChangePassword = () => {
    const url = new URL(`${COGNITO_DOMAIN}/forgotPassword`)
    url.searchParams.set('client_id', COGNITO_CLIENT_ID)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'email openid profile')
    url.searchParams.set('redirect_uri', COGNITO_REDIRECT)
    window.location.assign(url.toString())
  }

  // ── Account deletion ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!tokens?.idToken) return
    if (deleteText.trim().toUpperCase() !== 'SUPPRIMER') {
      setDeleteError('Tape SUPPRIMER pour confirmer')
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })
      if (!res.ok && res.status !== 404) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erreur ${res.status}`)
      }
      logout()
      router.push('/')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (!mounted || !tokens || !user) return null

  return (
    <div className="min-h-[calc(100vh-64px)] pt-20 pb-24" style={{ background: '#030b1a' }}>
      <Container>
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Paramètres</h1>
              <p className="text-sm text-white/50 mt-1">Gère ton compte, tes préférences et ta sécurité</p>
            </div>
            <AnimatePresence>
              {savedFlash && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <Check className="w-3.5 h-3.5" /> Enregistré
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* 1. Langue */}
          <Section icon={Globe} title="Langue">
            <div className="grid grid-cols-2 gap-2">
              {(['fr', 'en'] as const).map((code) => {
                const active = lang === code
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition text-sm font-semibold ${
                      active
                        ? 'bg-[#0097FC]/15 border-[#0097FC]/50 text-[#0097FC]'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                    <span className="uppercase tracking-wider">{code === 'fr' ? 'Français' : 'English'}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 2. Thème */}
          <Section icon={theme === 'dark' ? Moon : Sun} title="Thème">
            <div className="grid grid-cols-2 gap-2">
              {(['dark', 'light'] as const).map((mode) => {
                const active = theme === mode
                const Icon = mode === 'dark' ? Moon : Sun
                return (
                  <button
                    key={mode}
                    onClick={() => { if (theme !== mode) toggleTheme() }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition text-sm font-semibold ${
                      active
                        ? 'bg-[#0097FC]/15 border-[#0097FC]/50 text-[#0097FC]'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{mode === 'dark' ? 'Sombre' : 'Clair'}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 3. Notifications */}
          <Section icon={Bell} title="Notifications">
            <div className="divide-y divide-white/5">
              {NOTIF_ITEMS.map(({ key, label, desc, emoji }) => (
                <div key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-xl" aria-hidden>{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/45">{desc}</p>
                  </div>
                  <Toggle checked={prefs[key]} onChange={() => updatePref(key)} label={label} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/35 mt-3">
              Tes préférences sont enregistrées localement sur cet appareil.
            </p>
          </Section>

          {/* 4. Sécurité */}
          <Section icon={Shield} title="Sécurité">
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-[#0097FC]" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Changer mon mot de passe</p>
                  <p className="text-xs text-white/45">Tu seras redirigé vers la page sécurisée Cognito</p>
                </div>
              </div>
              <span className="text-white/30 group-hover:text-white/60 transition">→</span>
            </button>
          </Section>

          {/* 5. Compte / Zone dangereuse */}
          <Section icon={Trash2} title="Compte">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-300">Supprimer mon compte</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Cette action est irréversible. Toutes tes données (défis, gains, messages) seront supprimées.
                  </p>
                  <button
                    onClick={() => { setConfirmDelete(true); setDeleteText(''); setDeleteError(null) }}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          </Section>

        </div>
      </Container>

      {/* ── Confirmation modal ──────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setConfirmDelete(false)}
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ y: 10, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md pointer-events-auto"
              >
                <div className="bg-[#0d1226] rounded-2xl shadow-2xl border border-red-500/30 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Confirmer la suppression
                    </h3>
                    <button
                      onClick={() => !deleting && setConfirmDelete(false)}
                      disabled={deleting}
                      className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-white/80">
                      Tu es sur le point de supprimer définitivement le compte
                      {' '}<span className="font-bold text-white">{user.username}</span>.
                    </p>
                    <p className="text-xs text-white/50">
                      Cette action est <strong className="text-red-300">irréversible</strong>.
                      Tape <code className="px-1.5 py-0.5 rounded bg-white/10 text-red-300 font-bold">SUPPRIMER</code> pour confirmer.
                    </p>
                    <input
                      autoFocus
                      value={deleteText}
                      onChange={(e) => { setDeleteText(e.target.value); setDeleteError(null) }}
                      placeholder="SUPPRIMER"
                      disabled={deleting}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 text-sm font-mono tracking-wider"
                    />
                    {deleteError && (
                      <p className="text-xs text-red-400">⚠ {deleteError}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 text-white text-sm font-semibold transition disabled:opacity-40"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting || deleteText.trim().toUpperCase() !== 'SUPPRIMER'}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {deleting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Suppression…
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
