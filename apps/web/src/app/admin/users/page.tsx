'use client'

import { useEffect, useState } from 'react'
import { Search, CheckCircle, Ban, DollarSign, PlusCircle, MinusCircle, X, ChevronLeft, ChevronRight, Shield, ShieldCheck, ShieldX } from 'lucide-react'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

type User = {
  id: string
  username: string
  email: string
  role: string
  status: string
  isBanned: boolean
  isVerified: boolean
  gamesPlayed: number
  createdAt: string
  avatar?: string
  balance: number
  kycStatus?: string
  kycFirstName?: string
  kycLastName?: string
}

export default function UsersPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [adjustUser, setAdjustUser] = useState<User | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [kycRejectUser, setKycRejectUser] = useState<User | null>(null)
  const [kycRejectReason, setKycRejectReason] = useState('')

  const fetchUsers = async () => {
    if (!idToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [idToken, page])

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleBan = async () => {
    if (!selectedUser || !idToken) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ reason: banReason, duration: banDuration ? parseInt(banDuration) : undefined }),
      })
      setBanModalOpen(false)
      setBanReason('')
      setBanDuration('')
      fetchUsers()
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  const handleUnban = async (userId: string) => {
    if (!idToken) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to unban user:', error)
    }
  }

  const handleVerify = async (userId: string) => {
    if (!idToken) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to verify user:', error)
    }
  }

  const handleKycVerify = async (userId: string) => {
    if (!idToken) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/kyc/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      setActionMsg('KYC validé — retraits débloqués pour cet utilisateur')
      fetchUsers()
    } catch { setActionMsg('Erreur KYC verify') }
    setTimeout(() => setActionMsg(''), 3500)
  }

  const handleKycReject = async () => {
    if (!kycRejectUser || !idToken || !kycRejectReason.trim()) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${kycRejectUser.id}/kyc/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ reason: kycRejectReason }),
      })
      setKycRejectUser(null); setKycRejectReason('')
      setActionMsg('KYC refusé — utilisateur notifié')
      fetchUsers()
    } catch { setActionMsg('Erreur KYC reject') }
    setTimeout(() => setActionMsg(''), 3500)
  }

  const handleAdjustWallet = async () => {
    if (!adjustUser || !adjustAmount || !idToken) return
    setAdjustLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/wallet/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: adjustUser.id, amount: Number(adjustAmount), type: adjustType, description: adjustDesc || `Ajustement admin` }),
      })
      if (!res.ok) throw new Error()
      setActionMsg(`Wallet de ${adjustUser.username} ${adjustType === 'CREDIT' ? 'crédité' : 'débité'} de ${adjustAmount} CFA`)
      setAdjustUser(null); setAdjustAmount(''); setAdjustDesc('')
      fetchUsers()
    } catch {
      setActionMsg('Erreur lors de l\'ajustement')
    } finally {
      setAdjustLoading(false)
      setTimeout(() => setActionMsg(''), 3500)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
            Utilisateurs
          </h1>
          <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">{total} utilisateurs au total</p>
        </div>
      </div>

      {actionMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {['', 'USER', 'ADMIN', 'MODERATOR'].map(r => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              roleFilter === r ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70'
            }`}>
            {r || 'Tous'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-white/40 text-[#00165F]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-xl dark:bg-[#00165F]/40 bg-white border dark:border-white/10 border-[#00165F]/10 dark:text-white text-[#00165F] placeholder:dark:text-white/40 placeholder:text-[#00165F]/40 focus:outline-none focus:border-[#0097FC] text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition text-sm"
        >
          Chercher
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Email</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden sm:table-cell">Solde</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden xl:table-cell">KYC</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Inscrit le</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {users.map((user) => (
                  <tr key={user.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0" />
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold dark:text-white text-[#00165F] text-sm block truncate max-w-[100px] sm:max-w-none">{user.username}</span>
                          <span className="text-xs dark:text-white/40 text-[#00165F]/40 md:hidden truncate block max-w-[100px]">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden md:table-cell">{user.email}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {user.isBanned ? (
                        <AdminBadge status="Banni" variant="danger" />
                      ) : user.isVerified ? (
                        <AdminBadge status="Vérifié" variant="success" />
                      ) : (
                        <AdminBadge status={user.role === 'ADMIN' ? 'ADMIN' : user.status} variant={user.role === 'ADMIN' ? 'danger' : 'default'} />
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold dark:text-white text-[#00165F] hidden sm:table-cell">{user.balance} CFA</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                      {user.kycStatus === 'VERIFIED'
                        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400"><ShieldCheck className="w-3 h-3" /> Vérifié</span>
                        : user.kycStatus === 'SUBMITTED'
                        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400"><Shield className="w-3 h-3" /> En attente</span>
                        : user.kycStatus === 'REJECTED'
                        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400"><ShieldX className="w-3 h-3" /> Refusé</span>
                        : <span className="text-xs dark:text-white/30 text-[#00165F]/30">—</span>
                      }
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => { setAdjustUser(user); setAdjustAmount(''); setAdjustType('CREDIT'); setAdjustDesc('') }}
                          className="p-1.5 sm:p-2 rounded-lg dark:bg-[#0097FC]/20 bg-blue-100 text-[#0097FC] hover:bg-[#0097FC]/30 transition"
                          title="Ajuster wallet"
                        >
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        {!user.isVerified && (
                          <button
                            onClick={() => handleVerify(user.id)}
                            className="p-1.5 sm:p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-100 text-emerald-600 hover:bg-emerald-500/30 transition"
                            title="Vérifier"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        {user.kycStatus === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleKycVerify(user.id)}
                              className="p-1.5 sm:p-2 rounded-lg bg-green-400/20 text-green-400 hover:bg-green-400/30 transition"
                              title="Valider KYC"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setKycRejectUser(user); setKycRejectReason('') }}
                              className="p-1.5 sm:p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition"
                              title="Refuser KYC"
                            >
                              <ShieldX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnban(user.id)}
                            className="p-1.5 sm:p-2 rounded-lg dark:bg-blue-500/20 bg-blue-100 text-blue-600 hover:bg-blue-500/30 transition"
                            title="Débannir"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedUser(user); setBanModalOpen(true) }}
                            className="p-1.5 sm:p-2 rounded-lg dark:bg-red-500/20 bg-red-100 text-red-600 hover:bg-red-500/30 transition"
                            title="Bannir"
                          >
                            <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">Page {page}/{totalPages}</p>
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

      {/* Adjust Wallet Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">Wallet — {adjustUser.username}</h3>
              <button onClick={() => setAdjustUser(null)} className="dark:text-white/50 text-[#00165F]/50 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setAdjustType('CREDIT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                    adjustType === 'CREDIT' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400' : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/50 text-[#00165F]/50'
                  }`}>
                  <PlusCircle className="w-4 h-4" /> Créditer
                </button>
                <button onClick={() => setAdjustType('DEBIT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                    adjustType === 'DEBIT' ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/50 text-[#00165F]/50'
                  }`}>
                  <MinusCircle className="w-4 h-4" /> Débiter
                </button>
              </div>
              <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Montant en CFA..."
                className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
              <input value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Description (optionnel)..."
                className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm" />
              <div className="flex gap-3">
                <button onClick={() => setAdjustUser(null)}
                  className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">Annuler</button>
                <button onClick={handleAdjustWallet} disabled={!adjustAmount || adjustLoading}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition flex items-center justify-center gap-2 ${
                    adjustType === 'CREDIT' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}>
                  {adjustLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Reject Modal */}
      {kycRejectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">❌ Refuser KYC — {kycRejectUser.username}</h3>
              <button onClick={() => setKycRejectUser(null)} className="dark:text-white/50 text-[#00165F]/50 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs dark:text-white/60 text-[#00165F]/60 mb-4">
              {kycRejectUser.kycFirstName} {kycRejectUser.kycLastName}
            </p>
            <label className="block text-sm font-semibold dark:text-white/60 text-[#00165F]/60 mb-2">Raison du refus *</label>
            <textarea
              value={kycRejectReason}
              onChange={(e) => setKycRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC] text-sm"
              rows={3}
              placeholder="ex: Photo illisible, document expiré..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setKycRejectUser(null)}
                className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">Annuler</button>
              <button onClick={handleKycReject} disabled={!kycRejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-50 hover:bg-red-600 transition">
                Refuser le dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 border-[#00165F]/10">
            <h3 className="text-xl font-bold dark:text-white text-[#00165F] mb-4">Bannir {selectedUser?.username}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold dark:text-white/60 text-[#00165F]/60 mb-2">Raison</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/10 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC]"
                  rows={3}
                  placeholder="Raison du bannissement..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold dark:text-white/60 text-[#00165F]/60 mb-2">
                  Durée (heures, laisser vide pour permanent)
                </label>
                <input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/10 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 dark:text-white text-[#00165F] focus:outline-none focus:border-[#0097FC]"
                  placeholder="24"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setBanModalOpen(false); setBanReason(''); setBanDuration('') }}
                  className="flex-1 px-4 py-3 rounded-xl dark:bg-white/10 bg-[#00165F]/10 dark:text-white text-[#00165F] font-bold hover:bg-[#00165F]/20 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBan}
                  disabled={!banReason.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 transition"
                >
                  Bannir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
