'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

export default function WalletPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idToken) return
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/wallet/platform-stats`, {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/wallet/transactions?limit=20`, {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then(r => r.json()),
    ])
      .then(([statsData, txData]) => {
        setStats(statsData)
        setTransactions(txData.transactions || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [idToken])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
        Wallet Admin
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          title="Total commissions"
          value={`${stats.totalCommissions.toLocaleString('fr-FR')} CFA`}
          icon={DollarSign}
          color="#0097FC"
        />
        <StatCard
          title="En circulation"
          value={`${stats.totalInCirculation.toLocaleString('fr-FR')} CFA`}
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Total retraits"
          value={`${stats.totalWithdrawals.toLocaleString('fr-FR')} CFA`}
          icon={TrendingDown}
          color="#f59e0b"
        />
      </div>

      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-white/10 border-[#00165F]/10">
          <h3 className="text-sm sm:text-lg font-bold dark:text-white text-[#00165F]">Transactions récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[450px]">
            <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Type</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Montant</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
              {transactions.map((tx) => (
                <tr key={tx.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold dark:text-white text-[#00165F] text-sm">
                    {tx.wallet?.user?.username || 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4"><AdminBadge status={tx.type} variant="info" /></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold dark:text-white text-[#00165F]">
                    {Number(tx.amount).toLocaleString('fr-FR')} CFA
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <AdminBadge 
                      status={tx.status} 
                      variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'} 
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden md:table-cell">
                    {new Date(tx.createdAt).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
