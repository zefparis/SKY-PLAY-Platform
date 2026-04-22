'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/

function looksLikeEmail(username: string): boolean {
  return username.includes('@') || /^player_\d+$/.test(username)
}

export default function UsernameSetupModal() {
  const user = useAuthStore((s) => s.user)
  const tokens = useAuthStore((s) => s.tokens)

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user || !looksLikeEmail(user.username)) return null

  const validate = (val: string): string => {
    if (!val) return 'Le pseudo est obligatoire'
    if (val.length < 3) return 'Minimum 3 caractères'
    if (val.length > 20) return 'Maximum 20 caractères'
    if (!USERNAME_REGEX.test(val)) return 'Lettres, chiffres, _ . - uniquement — pas d\'espaces ni @'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate(username.trim())
    if (validationError) { setError(validationError); return }

    setSaving(true)
    setError('')
    try {
      const token = tokens?.idToken || tokens?.accessToken || ''
      const res = await fetch(`${API}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Erreur lors de la mise à jour')
      }

      const updatedUser = await res.json()
      // Patch auth store directly
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, username: updatedUser.username } : s.user,
      }))
      // Persist
      const stored = localStorage.getItem('skyplay-auth')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.user) {
            parsed.user.username = updatedUser.username
            localStorage.setItem('skyplay-auth', JSON.stringify(parsed))
          }
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#00165F] border border-white/15 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎮</div>
          <h2 className="text-2xl font-black text-white mb-1">Choisis ton pseudo</h2>
          <p className="text-white/60 text-sm">
            Avant de continuer, choisis un pseudo unique.<br />
            Il sera visible de tous les joueurs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(validate(e.target.value))
              }}
              placeholder="ex: john.doe"
              autoFocus
              maxLength={20}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#0097FC] text-base font-semibold"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-400">{error}</p>
            )}
            <p className="mt-1.5 text-xs text-white/40">
              3–20 caractères · lettres, chiffres, <code className="text-white/60">_ . -</code> autorisés
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || !!validate(username)}
            className="w-full py-3 rounded-xl bg-[#0097FC] hover:bg-[#0097FC]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : (
              'Confirmer mon pseudo'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
