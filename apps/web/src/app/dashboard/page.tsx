"use client"

import WalletCard from '@/components/wallet/WalletCard'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import Card from '@/components/ui/Card'
import { Trophy, Gamepad2, TrendingUp } from 'lucide-react'
import Container from '@/components/ui/Container'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function DashboardPage() {
  const { t } = useI18n()

  const mockChallenges = [
    {
      id: '1',
      title: 'FIFA 24 1v1',
      game: 'FIFA 24',
      entryFee: 5000,
      prizePool: 45000,
      maxPlayers: 10,
      currentPlayers: 7,
      status: 'OPEN',
    },
    {
      id: '2',
      title: 'COD Warzone Squad',
      game: 'Call of Duty',
      entryFee: 10000,
      prizePool: 90000,
      maxPlayers: 8,
      currentPlayers: 8,
      status: 'FULL',
    },
  ]

  const mockStats = [
    { label: t('dashboard.stats.totalWins'), value: '12', icon: Trophy, color: 'text-secondary' },
    { label: t('dashboard.stats.activeChallenges'), value: '3', icon: Gamepad2, color: 'text-secondary' },
    { label: t('dashboard.stats.winRate'), value: '68%', icon: TrendingUp, color: 'text-secondary' },
  ]

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 title-tech">{t('dashboard.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <WalletCard balance={125000} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
            {mockStats.map((stat, i) => (
              <Card key={i} className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue flex items-center justify-center shrink-0 ${stat.color}`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white/60 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{t('dashboard.section.activeChallenges')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {mockChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{t('dashboard.section.recentMatches')}</h2>
          <Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">FIFA 24 1v1</p>
                      <p className="text-sm text-white/60">{t('dashboard.match.ago')}</p>
                    </div>
                  </div>
                  <Badge variant="success">{t('dashboard.match.won')}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </Container>
      </main>
    </div>
  )
}
