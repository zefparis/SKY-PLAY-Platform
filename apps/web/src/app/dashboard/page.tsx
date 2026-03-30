"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import Card from '@/components/ui/Card'
import { Trophy, Gamepad2, TrendingUp, Wallet, Plus, ArrowUpRight, RefreshCw, Zap } from 'lucide-react'
import Container from '@/components/ui/Container'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/lib/auth-store'
import { formatCFA } from '@/lib/currency'
import DepositModal from '@/components/wallet/DepositModal'
import WithdrawModal from '@/components/wallet/WithdrawModal'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function DashboardPage() {
  const { t } = useI18n()
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const initialized = useAuthStore((s) => s.initialized)
  
  const [wallet, setWallet] = useState<any>(null)
  const [challenges, setChallenges] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  const loadWallet = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setWallet(await res.json())
    } catch {}
  }, [])

  const loadChallenges = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/challenges?status=OPEN&limit=6`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges || [])
      }
    } catch {}
  }, [])

  const loadUserStats = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/users/me/stats`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setUserStats(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    if (!initialized || !idToken) { setLoading(false); return }
    Promise.all([loadWallet(idToken), loadChallenges(idToken), loadUserStats(idToken)]).finally(() => setLoading(false))
  }, [initialized, idToken, loadWallet, loadChallenges, loadUserStats])

  const handleRefresh = () => {
    if (!idToken) return
    loadWallet(idToken)
    loadChallenges(idToken)
    loadUserStats(idToken)
  }

  const handleDepositSuccess = () => {
    if (!idToken) return
    loadWallet(idToken)
  }

  const handleWithdrawSuccess = () => {
    if (!idToken) return
    loadWallet(idToken)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    )
  }

  if (!idToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Gamepad2 className="w-14 h-14 dark:text-white/20 text-[#00165F]/20" />
        <p className="text-lg font-bold dark:text-white text-[#00165F]">{t('dashboard.loginRequired')}</p>
        <Link href="/login" className="px-6 py-2.5 rounded-xl bg-[#0097FC] text-white font-bold text-sm hover:bg-[#0097FC]/90 transition">
          {t('wallet.signIn')}
        </Link>
      </div>
    )
  }

  const balance = wallet?.balance ?? 0
  const stats = wallet?.stats ?? { totalDeposited: 0, totalWon: 0, totalMised: 0, gainsNets: 0 }
  const totalWins = userStats?.totalWins ?? 0
  const totalChallenges = userStats?.totalChallenges ?? 0
  const winRate = totalChallenges > 0 ? Math.round((totalWins / totalChallenges) * 100) : 0

  return (
    <>
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50">
      <main className="pb-12">
        <Container>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold dark:text-white text-[#00165F] title-tech">{t('dashboard.title')}</h1>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] hover:border-[#0097FC] transition">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">{t('wallet.refresh')}</span>
          </button>
        </div>

        {/* Wallet Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="gradient-primary relative overflow-hidden text-white border-0 shadow-glow-blue dark:shadow-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="relative">
              {/* Balance row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">{t('wallet.balance')}</p>
                  <motion.p key={balance} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-3xl sm:text-4xl font-black text-white leading-tight">
                    {formatCFA(balance)}
                  </motion.p>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 mb-6">
                <button onClick={() => setShowDeposit(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white text-[#00165F] font-bold text-sm hover:bg-white/90 transition shadow-lg">
                  <Plus className="w-4 h-4" /> {t('wallet.deposit')}
                </button>
                <button onClick={() => setShowWithdraw(true)} disabled={balance < 1000} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white/20 text-white font-bold text-sm hover:bg-white/30 transition border border-white/30 disabled:opacity-40">
                  <ArrowUpRight className="w-4 h-4" /> {t('wallet.withdraw')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('wallet.totalDeposited'), value: stats.totalDeposited, color: 'text-green-300' },
                  { label: t('wallet.totalWon'), value: stats.totalWon, color: 'text-yellow-300' },
                  { label: t('wallet.totalBet'), value: stats.totalMised, color: 'text-blue-300' },
                  { label: t('wallet.netGains'), value: stats.gainsNets, color: stats.gainsNets >= 0 ? 'text-green-300' : 'text-red-300' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl bg-white/10 p-3">
                    <p className="text-xs text-white/60 mb-1">{s.label}</p>
                    <p className={`text-lg font-black ${s.color}`}>{formatCFA(Math.abs(s.value))}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t('dashboard.stats.totalWins'), value: totalWins, icon: Trophy, color: 'text-[#0097FC]' },
            { label: t('dashboard.stats.activeChallenges'), value: challenges.length, icon: Gamepad2, color: 'text-[#0097FC]' },
            { label: t('dashboard.stats.winRate'), value: `${winRate}%`, icon: TrendingUp, color: 'text-[#0097FC]' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-[#0097FC]/10 border border-[#0097FC]/20 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm dark:text-white/60 text-[#00165F]/60">{stat.label}</p>
                  <p className="text-2xl font-black dark:text-white text-[#00165F]">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Active Challenges */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold dark:text-white text-[#00165F]">{t('dashboard.section.activeChallenges')}</h2>
            <Link href="/challenges" className="flex items-center gap-1 text-sm font-medium text-[#0097FC] hover:underline">
              {t('dashboard.seeAll')} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {challenges.length === 0 ? (
            <Card className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto dark:text-white/20 text-[#00165F]/20 mb-3" />
              <p className="dark:text-white/50 text-[#00165F]/50 mb-4">{t('dashboard.noActiveChallenge')}</p>
              <Link href="/challenges" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0097FC] text-white font-bold text-sm hover:bg-[#0097FC]/90 transition">
                <Plus className="w-4 h-4" /> {t('challenges.create')}
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.slice(0, 6).map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-[#00165F] mb-4">{t('dashboard.quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('challenges.create'), icon: Plus, href: '/challenges', color: 'bg-[#0097FC]' },
              { label: t('dashboard.action.myChallenges'), icon: Gamepad2, href: '/challenges?filter=mine', color: 'bg-purple-500' },
              { label: t('nav.leaderboard'), icon: Trophy, href: '/leaderboard', color: 'bg-yellow-500' },
              { label: t('dashboard.action.wallet'), icon: Wallet, href: '/wallet', color: 'bg-green-500' },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <Card className="group hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold dark:text-white text-[#00165F] group-hover:text-[#0097FC] transition">{action.label}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        </Container>
      </main>
    </div>
    {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />}
    {showWithdraw && <WithdrawModal balance={balance} onClose={() => setShowWithdraw(false)} onSuccess={handleWithdrawSuccess} />}
    </>
  )
}
