'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Users, Trophy, TrendingUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '@/components/admin/StatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

type Stats = {
  users: { total: number; online: number; newToday: number; newThisWeek: number; banned: number }
  challenges: { total: number; active: number; completed: number; disputed: number; cancelledToday: number }
  revenue: { totalCommissions: number; todayCommissions: number; weekCommissions: number; monthCommissions: number }
  wallet: { totalDeposited: number; totalWithdrawn: number; platformBalance: number }
}

type ChartData = {
  revenue: Array<{ date: string; amount: number }>
  newUsers: Array<{ date: string; count: number }>
  challenges: Array<{ date: string; count: number }>
}

export default function AdminDashboard() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idToken) return

    const fetchData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats/chart?period=30d`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ])

        const [statsData, chartDataRes] = await Promise.all([statsRes.json(), chartRes.json()])
        setStats(statsData)
        setChartData(chartDataRes)
      } catch (error) {
        console.error('Failed to fetch admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [idToken])

  if (loading || !stats || !chartData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    )
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('fr-FR')} CFA`

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F] mb-1" style={{ fontFamily: 'Dena, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60">Vue d'ensemble de la plateforme SKY PLAY</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Revenus du mois"
          value={formatCurrency(stats.revenue.monthCommissions)}
          change={`+${((stats.revenue.monthCommissions / (stats.revenue.totalCommissions || 1)) * 100).toFixed(1)}%`}
          icon={DollarSign}
          color="#0097FC"
        />
        <StatCard
          title="Utilisateurs actifs"
          value={stats.users.total}
          change={`+${stats.users.newThisWeek} cette semaine`}
          icon={Users}
          color="#10b981"
        />
        <StatCard
          title="Défis actifs"
          value={stats.challenges.active}
          change={stats.challenges.disputed > 0 ? `${stats.challenges.disputed} en litige` : 'Aucun litige'}
          icon={Trophy}
          color="#f59e0b"
        />
        <StatCard
          title="Taux de complétion"
          value={`${((stats.challenges.completed / (stats.challenges.total || 1)) * 100).toFixed(0)}%`}
          change={`${stats.challenges.completed}/${stats.challenges.total} défis`}
          icon={TrendingUp}
          color="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-4 sm:p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm">
          <h3 className="text-sm sm:text-lg font-bold dark:text-white text-[#00165F] mb-3 sm:mb-4">Revenus (30 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00165F', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="amount" stroke="#0097FC" strokeWidth={2} dot={{ fill: '#0097FC' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* New Users Chart */}
        <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-4 sm:p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm">
          <h3 className="text-sm sm:text-lg font-bold dark:text-white text-[#00165F] mb-3 sm:mb-4">Inscriptions (30 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.newUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00165F', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#00165F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Disputes */}
        <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-4 sm:p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-lg font-bold dark:text-white text-[#00165F]">Litiges en attente</h3>
            <AdminBadge status={`${stats.challenges.disputed}`} variant="danger" />
          </div>
          {stats.challenges.disputed === 0 ? (
            <p className="text-sm dark:text-white/40 text-[#00165F]/40 text-center py-8">Aucun litige en attente</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm dark:text-white/60 text-[#00165F]/60">
                {stats.challenges.disputed} litige{stats.challenges.disputed > 1 ? 's' : ''} nécessite{stats.challenges.disputed > 1 ? 'nt' : ''} votre attention
              </p>
              <a
                href="/admin/disputes"
                className="inline-block px-4 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm hover:bg-[#0097FC]/90 transition"
              >
                Voir les litiges
              </a>
            </div>
          )}
        </div>

        {/* Platform Stats */}
        <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-4 sm:p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm">
          <h3 className="text-sm sm:text-lg font-bold dark:text-white text-[#00165F] mb-3 sm:mb-4">Statistiques wallet</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-white/60 text-[#00165F]/60">Total déposé</span>
              <span className="text-sm font-bold dark:text-white text-[#00165F]">{formatCurrency(stats.wallet.totalDeposited)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-white/60 text-[#00165F]/60">Total retiré</span>
              <span className="text-sm font-bold dark:text-white text-[#00165F]">{formatCurrency(stats.wallet.totalWithdrawn)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t dark:border-white/10 border-[#00165F]/10">
              <span className="text-sm font-bold dark:text-white text-[#00165F]">Solde plateforme</span>
              <span className="text-lg font-black text-[#0097FC]">{formatCurrency(stats.wallet.platformBalance)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
