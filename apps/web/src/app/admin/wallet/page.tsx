'use client'

import { useEffect, useState, useCallback } from 'react'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, X, PlusCircle, MinusCircle, FlaskConical, Gift, Users, Zap } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const TYPE_OPTS = ['', 'DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'REFUND', 'CREDIT', 'DEBIT', 'CHALLENGE_DEBIT', 'CHALLENGE_CREDIT', 'TEST_CREDIT']
const STATUS_OPTS = ['', 'COMPLETED', 'PENDING', 'FAILED']

export default function AdminWalletPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [refunding, setRefunding] = useState<string | null>(null)

  const [adjustModal, setAdjustModal] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  // ── Test credits state ──
  const [tcUserQuery, setTcUserQuery] = useState('')
  const [tcUsers, setTcUsers] = useState<any[]>([])
  const [tcSearching, setTcSearching] = useState(false)
  const [tcSelectedUser, setTcSelectedUser] = useState<any>(null)
  const [tcAmount, setTcAmount] = useState(5000)
  const [tcCustom, setTcCustom] = useState('')
  const [tcNote, setTcNote] = useState('')
  const [tcLoading, setTcLoading] = useState(false)
  const [tcDistribLoading, setTcDistribLoading] = useState(false)
  const [tcStats, setTcStats] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  const notify = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3500) }

  const loadStats = useCallback(async () => {
    if (!idToken) return
    const res = await fetch(`${API}/admin/wallet/platform-stats`, { headers: { Authorization: `Bearer ${idToken}` } })
    if (res.ok) setStats(await res.json())
  }, [idToken])

  const loadTx = useCallback(async () => {
    if (!idToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`${API}/admin/wallet/transactions?${params}`, { headers: { Authorization: `Bearer ${idToken}` } })
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
    } catch {}
    finally { setLoading(false) }
  }, [idToken, page, typeFilter, statusFilter])

  const loadTcStats = useCallback(async () => {
    if (!idToken) return
    const [r1, r2] = await Promise.all([
      fetch(`${API}/admin/wallet/test-credits-stats`, { headers: { Authorization: `Bearer ${idToken}` } }),
      fetch(`${API}/admin/wallet/recent-users`, { headers: { Authorization: `Bearer ${idToken}` } }),
    ])
    if (r1.ok) setTcStats(await r1.json())
    if (r2.ok) setRecentUsers(await r2.json())
  }, [idToken])

  useEffect(() => { loadStats(); loadTx(); loadTcStats() }, [loadStats, loadTx, loadTcStats])

  const searchUsers = async (q: string) => {
    if (!idToken || q.length < 2) { setTcUsers([]); return }
    setTcSearching(true)
    try {
      const res = await fetch(`${API}/admin/users?search=${encodeURIComponent(q)}&limit=5`, { headers: { Authorization: `Bearer ${idToken}` } })
      const data = await res.json()
      setTcUsers(data.users || [])
    } catch {} finally { setTcSearching(false) }
  }

  const handleAddTestCredits = async (userId: string, amount: number, note?: string) => {
    if (!idToken) return
    setTcLoading(true)
    try {
      const res = await fetch(`${API}/admin/wallet/add-test-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId, amount, note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur')
      notify(`✅ ${amount.toLocaleString('fr-FR')} CFA attribués — Nouveau solde : ${data.newBalance.toLocaleString('fr-FR')} CFA`)
      setTcSelectedUser(null); setTcUserQuery(''); setTcUsers([]); setTcNote('')
      loadTcStats(); loadTx()
    } catch (e: any) { notify(`❌ ${e.message}`) }
    finally { setTcLoading(false) }
  }

  const handleDistribute = async () => {
    if (!idToken) return
    setTcDistribLoading(true)
    try {
      const res = await fetch(`${API}/admin/wallet/distribute-test-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ amount: 5000, note: 'Distribution globale admin' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur')
      notify(`🎁 ${data.usersCredited} utilisateurs crédités — Total : ${data.totalAmount.toLocaleString('fr-FR')} CFA`)
      loadTcStats(); loadTx()
    } catch (e: any) { notify(`❌ ${e.message}`) }
    finally { setTcDistribLoading(false) }
  }

  const handleRefund = async (txId: string) => {
    if (!idToken) return
    setRefunding(txId)
    try {
      const res = await fetch(`${API}/admin/wallet/refund/${txId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error()
      notify('Remboursement effectué')
      loadTx(); loadStats()
    } catch { notify('Erreur lors du remboursement') }
    finally { setRefunding(null) }
  }

  const handleAdjust = async () => {
    if (!adjustUserId || !adjustAmount || !idToken) return
    setAdjustLoading(true)
    try {
      const res = await fetch(`${API}/admin/wallet/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: adjustUserId, amount: Number(adjustAmount), type: adjustType, description: adjustDesc }),
      })
      if (!res.ok) throw new Error()
      notify(`Wallet ajusté — ${adjustType === 'CREDIT' ? '+' : '-'}${adjustAmount} CFA`)
      setAdjustModal(false); setAdjustUserId(''); setAdjustAmount(''); setAdjustDesc('')
      loadTx(); loadStats()
    } catch { notify('Erreur lors de l\'ajustement') }
    finally { setAdjustLoading(false) }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">Finances</h1>
          <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">{total} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdjustModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0097FC] text-white text-sm font-bold hover:bg-[#0097FC]/90 transition">
            <DollarSign className="w-4 h-4" /> Ajuster wallet
          </button>
          <button onClick={() => { loadStats(); loadTx() }}
            className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F]">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <StatCard title="Commissions totales" value={`${stats.totalCommissions.toLocaleString('fr-FR')} CFA`} icon={DollarSign} color="#0097FC" />
          <StatCard title="En circulation" value={`${stats.totalInCirculation.toLocaleString('fr-FR')} CFA`} icon={TrendingUp} color="#10b981" />
          <StatCard title="Total retraits" value={`${stats.totalWithdrawals.toLocaleString('fr-FR')} CFA`} icon={TrendingDown} color="#f59e0b" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] appearance-none cursor-pointer [&>option]:bg-[#00165F] [&>option]:text-white"
          style={{ colorScheme: 'dark' }}>
          {TYPE_OPTS.map(t => <option key={t} value={t}>{t || 'Tous types'}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] appearance-none cursor-pointer [&>option]:bg-[#00165F] [&>option]:text-white"
          style={{ colorScheme: 'dark' }}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s || 'Tous statuts'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center py-16 dark:text-white/40 text-[#00165F]/40 text-sm">Aucune transaction</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Type</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Montant</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-4 py-3 font-semibold dark:text-white text-[#00165F] text-sm">
                      {tx.wallet?.user?.username || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-4 py-3"><AdminBadge status={tx.type} variant="info" /></td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-bold dark:text-white text-[#00165F]">
                      {Number(tx.amount).toLocaleString('fr-FR')} CFA
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <AdminBadge status={tx.status} variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'} />
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs dark:text-white/40 text-[#00165F]/40 hidden md:table-cell">
                      {new Date(tx.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      {tx.status === 'COMPLETED' && tx.type === 'DEPOSIT' && (
                        <button
                          onClick={() => handleRefund(tx.id)}
                          disabled={refunding === tx.id}
                          className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition disabled:opacity-50"
                          title="Rembourser"
                        >
                          {refunding === tx.id
                            ? <span className="w-3.5 h-3.5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin inline-block" />
                            : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      )}
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

      {/* ─── SECTION CRÉDITS TEST ─── */}
      <div className="rounded-2xl border-2 border-dashed border-[#0097FC]/30 dark:bg-[#0097FC]/5 bg-[#0097FC]/3 p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0097FC]/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[#0097FC]" />
          </div>
          <div>
            <h2 className="font-black dark:text-white text-[#00165F] text-base">🧪 CRÉDITS DE TEST</h2>
            <p className="text-xs dark:text-white/50 text-[#00165F]/50">Distribuer des Sky Credits test sans paiement réel</p>
          </div>
          {tcStats && (
            <div className="ml-auto text-right">
              <p className="text-xs dark:text-white/40 text-[#00165F]/40">Total distribué</p>
              <p className="font-black text-[#0097FC] text-sm">{(tcStats.totalDistributed ?? 0).toLocaleString('fr-FR')} CFA</p>
            </div>
          )}
        </div>

        {/* ─ Recherche utilisateur ─ */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold dark:text-white/60 text-[#00165F]/60 uppercase tracking-wide">Utilisateur</label>
          <div className="relative">
            <input
              value={tcUserQuery}
              onChange={e => { setTcUserQuery(e.target.value); setTcSelectedUser(null); searchUsers(e.target.value) }}
              placeholder="Rechercher par email ou username..."
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm"
            />
            {tcSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />}
          </div>
          {tcUsers.length > 0 && !tcSelectedUser && (
            <div className="rounded-xl border dark:border-white/10 border-gray-200 overflow-hidden">
              {tcUsers.map(u => (
                <button key={u.id} onClick={() => { setTcSelectedUser(u); setTcUserQuery(u.username); setTcUsers([]) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition text-left">
                  {u.avatar
                    ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-[#0097FC]/20 flex items-center justify-center text-[#0097FC] text-xs font-bold">{u.username?.[0]?.toUpperCase()}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-white text-[#00165F] truncate">{u.username}</p>
                    <p className="text-xs dark:text-white/40 text-[#00165F]/40 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-bold text-[#0097FC]">{Number(u.balance).toLocaleString('fr-FR')} CFA</span>
                </button>
              ))}
            </div>
          )}
          {tcSelectedUser && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0097FC]/10 border border-[#0097FC]/30">
              {tcSelectedUser.avatar
                ? <img src={tcSelectedUser.avatar} className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-[#0097FC]/20 flex items-center justify-center text-[#0097FC] text-xs font-bold">{tcSelectedUser.username?.[0]?.toUpperCase()}</div>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold dark:text-white text-[#00165F]">{tcSelectedUser.username}</p>
                <p className="text-xs dark:text-white/50 text-[#00165F]/50">{tcSelectedUser.email}</p>
              </div>
              <span className="text-xs font-bold text-[#0097FC]">{Number(tcSelectedUser.balance ?? 0).toLocaleString('fr-FR')} CFA</span>
              <button onClick={() => { setTcSelectedUser(null); setTcUserQuery('') }} className="text-red-400 hover:text-red-300 ml-1"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {/* ─ Montants rapides ─ */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold dark:text-white/60 text-[#00165F]/60 uppercase tracking-wide">Montant</label>
          <div className="flex flex-wrap gap-2">
            {[1000, 2000, 5000, 10000].map(a => (
              <button key={a} onClick={() => { setTcAmount(a); setTcCustom('') }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${tcAmount === a && !tcCustom ? 'bg-[#0097FC] text-white shadow-lg shadow-[#0097FC]/30' : 'dark:bg-white/5 bg-gray-100 dark:text-white text-[#00165F] hover:border-[#0097FC]/50 border border-transparent'}`}>
                {a.toLocaleString('fr-FR')} CFA
              </button>
            ))}
            <input
              type="number" value={tcCustom}
              onChange={e => { setTcCustom(e.target.value); if (e.target.value) setTcAmount(0) }}
              placeholder="Montant libre"
              className="px-3 py-2 rounded-xl text-sm dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] w-32"
            />
          </div>
        </div>

        {/* ─ Note ─ */}
        <div>
          <input value={tcNote} onChange={e => setTcNote(e.target.value)}
            placeholder="Note admin (optionnelle)..."
            className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
        </div>

        {/* ─ CTA principal ─ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              const finalAmount = tcCustom ? parseInt(tcCustom) : tcAmount
              if (!tcSelectedUser || !finalAmount) return
              handleAddTestCredits(tcSelectedUser.id, finalAmount, tcNote || undefined)
            }}
            disabled={!tcSelectedUser || (!tcAmount && !tcCustom) || tcLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#0097FC]/90 transition">
            {tcLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
            Attribuer les crédits
          </button>
          <button
            onClick={handleDistribute}
            disabled={tcDistribLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-sm disabled:opacity-40 hover:bg-purple-500/30 transition">
            {tcDistribLoading ? <span className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /> : <Gift className="w-4 h-4" />}
            5 000 CFA à tous
          </button>
        </div>

        {/* ─ Liste 10 derniers users ─ */}
        {recentUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0097FC]" />
              <p className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 uppercase tracking-wide">Derniers inscrits</p>
            </div>
            <div className="grid gap-1.5">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-100">
                  {u.avatar
                    ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-[#0097FC]/15 flex items-center justify-center text-[#0097FC] text-xs font-bold flex-shrink-0">{u.username?.[0]?.toUpperCase()}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold dark:text-white text-[#00165F] truncate">{u.username}</p>
                    <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs dark:text-white/50 text-[#00165F]/50 font-mono">{u.balance.toLocaleString('fr-FR')} CFA</span>
                  <button
                    onClick={() => handleAddTestCredits(u.id, 5000, 'Crédit rapide admin')}
                    disabled={tcLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0097FC]/15 text-[#0097FC] text-xs font-bold hover:bg-[#0097FC]/25 transition disabled:opacity-40">
                    <Zap className="w-3 h-3" />+5K
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Wallet Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">Ajuster un wallet</h3>
              <button onClick={() => setAdjustModal(false)} className="dark:text-white/50 text-[#00165F]/50 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase mb-1.5">ID utilisateur</label>
                <input value={adjustUserId} onChange={e => setAdjustUserId(e.target.value)} placeholder="user-id..."
                  className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdjustType('CREDIT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition ${adjustType === 'CREDIT' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400' : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/50 text-[#00165F]/50'}`}>
                  <PlusCircle className="w-4 h-4" /> Créditer
                </button>
                <button onClick={() => setAdjustType('DEBIT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition ${adjustType === 'DEBIT' ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/50 text-[#00165F]/50'}`}>
                  <MinusCircle className="w-4 h-4" /> Débiter
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase mb-1.5">Montant (CFA)</label>
                <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="5000"
                  className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase mb-1.5">Description</label>
                <input value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Raison de l'ajustement..."
                  className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setAdjustModal(false)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">
                  Annuler
                </button>
                <button onClick={handleAdjust} disabled={!adjustUserId || !adjustAmount || adjustLoading}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition flex items-center justify-center gap-2 ${adjustType === 'CREDIT' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                  {adjustLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
