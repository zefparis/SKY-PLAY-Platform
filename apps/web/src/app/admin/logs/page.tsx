'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const ACTION_OPTS = [
  '', 'BAN_USER', 'UNBAN_USER', 'VERIFY_USER', 'UPDATE_USER',
  'CANCEL_CHALLENGE', 'FORCE_RESULT', 'RESOLVE_DISPUTE',
  'ADJUST_WALLET', 'REFUND_TRANSACTION',
]

export default function LogsPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const load = useCallback(async () => {
    if (!idToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`${API}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch {}
    finally { setLoading(false) }
  }, [idToken, page, actionFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / 50)

  const actionVariant = (action: string) => {
    if (action.includes('BAN')) return 'danger'
    if (action.includes('VERIFY') || action.includes('CREDIT')) return 'success'
    if (action.includes('REFUND') || action.includes('ADJUST')) return 'warning'
    return 'info'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">Audit Logs</h1>
          <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">{total} actions enregistrées</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Action filter */}
      <div className="flex flex-wrap gap-2">
        {ACTION_OPTS.map(a => (
          <button key={a} onClick={() => { setActionFilter(a); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              actionFilter === a
                ? 'bg-[#0097FC] text-white'
                : 'dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70'
            }`}>
            {a || 'Toutes actions'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-16 dark:text-white/40 text-[#00165F]/40 text-sm">Aucun log</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Admin</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Action</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden sm:table-cell">Cible</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Détails</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {logs.map((log) => (
                  <tr key={log.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-4 py-3 font-semibold dark:text-white text-[#00165F] text-sm">
                      {log.admin?.username || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <AdminBadge status={log.action} variant={actionVariant(log.action)} />
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs dark:text-white/60 text-[#00165F]/60 hidden sm:table-cell">
                      <span className="font-medium">{log.targetType || '—'}</span>
                      {log.targetId && <span className="opacity-50 ml-1">({log.targetId.substring(0, 8)}…)</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs dark:text-white/50 text-[#00165F]/50 max-w-[200px] truncate hidden lg:table-cell">
                      {log.details ? JSON.stringify(log.details).substring(0, 60) : '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs dark:text-white/40 text-[#00165F]/40 hidden md:table-cell whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
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
    </div>
  )
}
