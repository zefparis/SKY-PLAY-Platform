'use client'

import { useEffect, useState, useCallback } from 'react'
import { XCircle, Trophy, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const STATUS_OPTS = ['', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']
const STATUS_LABELS: Record<string, string> = {
  '': 'Tous', OPEN: 'Ouvert', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé', CANCELLED: 'Annulé', DISPUTED: 'Litige',
}

export default function ChallengesPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [challenges, setChallenges] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [cancelModal, setCancelModal] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const [forceModal, setForceModal] = useState<any>(null)
  const [forceWinner, setForceWinner] = useState('')
  const [forceLoading, setForceLoading] = useState(false)

  const [actionMsg, setActionMsg] = useState('')

  const load = useCallback(async () => {
    if (!idToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`${API}/admin/challenges?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      setChallenges(data.challenges || [])
      setTotal(data.total || 0)
    } catch {}
    finally { setLoading(false) }
  }, [idToken, page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason || !idToken) return
    setCancelLoading(true)
    try {
      const res = await fetch(`${API}/admin/challenges/${cancelModal.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ reason: cancelReason }),
      })
      if (!res.ok) throw new Error()
      setActionMsg('Défi annulé — remboursements effectués')
      setCancelModal(null)
      setCancelReason('')
      load()
    } catch {
      setActionMsg('Erreur lors de l\'annulation')
    } finally {
      setCancelLoading(false)
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  const handleForceResult = async () => {
    if (!forceModal || !forceWinner || !idToken) return
    setForceLoading(true)
    const participants = forceModal.participants || []
    const results = participants.map((p: any, i: number) => ({
      userId: p.userId,
      rank: p.userId === forceWinner ? 1 : i + 2,
    }))
    try {
      const res = await fetch(`${API}/admin/challenges/${forceModal.id}/force-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error()
      setActionMsg('Résultat forcé — challenge terminé')
      setForceModal(null)
      setForceWinner('')
      load()
    } catch {
      setActionMsg('Erreur lors du forçage')
    } finally {
      setForceLoading(false)
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">Défis</h1>
          <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">{total} défis au total</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === s
                ? 'bg-[#0097FC] text-white'
                : 'dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <p className="text-center py-16 dark:text-white/40 text-[#00165F]/40 text-sm">Aucun défi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Titre</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Joueurs</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden sm:table-cell">Pot</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Date</th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {challenges.map((c) => (
                  <tr key={c.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-semibold dark:text-white text-[#00165F] text-sm truncate max-w-[140px] sm:max-w-[200px]">{c.title}</p>
                      <p className="text-xs dark:text-white/40 text-[#00165F]/40">{c.game}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <AdminBadge
                        status={c.status}
                        variant={c.status === 'COMPLETED' ? 'success' : c.status === 'DISPUTED' ? 'danger' : c.status === 'CANCELLED' ? 'warning' : 'default'}
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm dark:text-white/60 text-[#00165F]/60 hidden md:table-cell">
                      {c.participants?.length ?? 0}/{c.maxPlayers}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-bold dark:text-white text-[#00165F] hidden sm:table-cell">
                      {Number(c.potTotal || 0).toLocaleString('fr-FR')} CFA
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs dark:text-white/40 text-[#00165F]/40 hidden lg:table-cell">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && (
                          <>
                            <button
                              onClick={() => { setCancelModal(c); setCancelReason('') }}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                              title="Annuler + rembourser"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            {c.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => { setForceModal(c); setForceWinner('') }}
                                className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition"
                                title="Forcer le résultat"
                              >
                                <Trophy className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs dark:text-white/50 text-[#00165F]/50">Page {page}/{totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] disabled:opacity-40 hover:border-[#0097FC] transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] disabled:opacity-40 hover:border-[#0097FC] transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">Annuler le défi</h3>
              <button onClick={() => setCancelModal(null)} className="dark:text-white/50 text-[#00165F]/50 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm dark:text-white/60 text-[#00165F]/60 mb-4">
              <strong className="dark:text-white text-[#00165F]">{cancelModal.title}</strong> — Les participants seront remboursés automatiquement.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Raison de l'annulation..."
              className="w-full px-4 py-3 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleCancel} disabled={!cancelReason.trim() || cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-50 hover:bg-red-600 transition flex items-center justify-center gap-2">
                {cancelLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Result Modal */}
      {forceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">Forcer le résultat</h3>
              <button onClick={() => setForceModal(null)} className="dark:text-white/50 text-[#00165F]/50 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm dark:text-white/60 text-[#00165F]/60 mb-4">
              Sélectionnez le gagnant de <strong className="dark:text-white text-[#00165F]">{forceModal.title}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(forceModal.participants || []).map((p: any) => (
                <button key={p.userId} onClick={() => setForceWinner(p.userId)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                    forceWinner === p.userId
                      ? 'border-[#0097FC] bg-[#0097FC]/10 dark:text-white text-[#00165F]'
                      : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/60 text-[#00165F]/60'
                  }`}>
                  {p.user?.username}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setForceModal(null)}
                className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleForceResult} disabled={!forceWinner || forceLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-50 hover:bg-[#0097FC]/90 transition flex items-center justify-center gap-2">
                {forceLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <Trophy className="w-4 h-4" /> Forcer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
