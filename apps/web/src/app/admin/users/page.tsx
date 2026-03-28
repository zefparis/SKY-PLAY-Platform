'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, CheckCircle, Ban, DollarSign } from 'lucide-react'
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
}

export default function UsersPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')

  const fetchUsers = async () => {
    if (!idToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (search) params.append('search', search)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
            Utilisateurs
          </h1>
          <p className="text-sm dark:text-white/60 text-[#00165F]/60">{total} utilisateurs au total</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-white/40 text-[#00165F]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-[#00165F]/40 bg-white border dark:border-white/10 border-[#00165F]/10 dark:text-white text-[#00165F] placeholder:dark:text-white/40 placeholder:text-[#00165F]/40 focus:outline-none focus:border-[#0097FC]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 transition"
        >
          Rechercher
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
            <table className="w-full">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Solde</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Parties</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Inscrit le</th>
                  <th className="px-6 py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {users.map((user) => (
                  <tr key={user.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-xs">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold dark:text-white text-[#00165F]">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-white/60 text-[#00165F]/60">{user.email}</td>
                    <td className="px-6 py-4">
                      <AdminBadge status={user.role} variant={user.role === 'ADMIN' ? 'danger' : 'default'} />
                    </td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <AdminBadge status="Banni" variant="danger" />
                      ) : user.isVerified ? (
                        <AdminBadge status="Vérifié" variant="success" />
                      ) : (
                        <AdminBadge status={user.status} variant="default" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold dark:text-white text-[#00165F]">{user.balance} CFA</td>
                    <td className="px-6 py-4 text-sm dark:text-white/60 text-[#00165F]/60">{user.gamesPlayed}</td>
                    <td className="px-6 py-4 text-sm dark:text-white/60 text-[#00165F]/60">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!user.isVerified && (
                          <button
                            onClick={() => handleVerify(user.id)}
                            className="p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-100 text-emerald-600 hover:bg-emerald-500/30 transition"
                            title="Vérifier"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnban(user.id)}
                            className="p-2 rounded-lg dark:bg-blue-500/20 bg-blue-100 text-blue-600 hover:bg-blue-500/30 transition"
                            title="Débannir"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedUser(user); setBanModalOpen(true) }}
                            className="p-2 rounded-lg dark:bg-red-500/20 bg-red-100 text-red-600 hover:bg-red-500/30 transition"
                            title="Bannir"
                          >
                            <Ban className="w-4 h-4" />
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
      <div className="flex items-center justify-between">
        <p className="text-sm dark:text-white/60 text-[#00165F]/60">
          Page {page} sur {Math.ceil(total / 20)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl dark:bg-white/10 bg-[#00165F]/10 dark:text-white text-[#00165F] font-semibold disabled:opacity-50 hover:bg-[#0097FC] hover:text-white transition"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 rounded-xl dark:bg-white/10 bg-[#00165F]/10 dark:text-white text-[#00165F] font-semibold disabled:opacity-50 hover:bg-[#0097FC] hover:text-white transition"
          >
            Suivant
          </button>
        </div>
      </div>

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
