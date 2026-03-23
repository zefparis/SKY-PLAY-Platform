"use client"

import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import Card from '@/components/ui/Card'
import { Trophy } from 'lucide-react'
import Container from '@/components/ui/Container'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function LeaderboardPage() {
  const { t } = useI18n()

  const mockLeaderboard = [
    { rank: 1, username: 'ProGamer123', wins: 45, earnings: 2500000, avatar: 'P' },
    { rank: 2, username: 'eSportsKing', wins: 42, earnings: 2100000, avatar: 'E' },
    { rank: 3, username: 'NinjaWarrior', wins: 38, earnings: 1800000, avatar: 'N' },
    { rank: 4, username: 'SkyMaster', wins: 35, earnings: 1500000, avatar: 'S' },
    { rank: 5, username: 'GameChampion', wins: 32, earnings: 1300000, avatar: 'G' },
    { rank: 6, username: 'ElitePlayer', wins: 30, earnings: 1100000, avatar: 'E' },
    { rank: 7, username: 'ProSniper', wins: 28, earnings: 950000, avatar: 'P' },
    { rank: 8, username: 'LegendKiller', wins: 25, earnings: 850000, avatar: 'L' },
    { rank: 9, username: 'TopFragger', wins: 23, earnings: 750000, avatar: 'T' },
    { rank: 10, username: 'ClutchMaster', wins: 20, earnings: 650000, avatar: 'C' },
  ]

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center glow-blue">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">{t('leaderboard.title')}</h1>
            <p className="text-white/65">{t('leaderboard.subtitle')}</p>
          </div>
        </div>

        <Card>
          <LeaderboardTable entries={mockLeaderboard} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto mb-4 shadow-glow-red">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">ProGamer123</h3>
            <p className="text-white/65 mb-4">{t('leaderboard.topPlayer')}</p>
            <p className="text-3xl font-bold text-gradient">45 {t('leaderboard.wins')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">2.5M XOF</h3>
            <p className="text-white/65 mb-4">{t('leaderboard.highestEarnings')}</p>
            <p className="text-lg text-secondary font-semibold">{t('leaderboard.thisMonth')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">156</h3>
            <p className="text-white/65 mb-4">{t('leaderboard.activePlayers')}</p>
            <p className="text-lg text-accent font-semibold">{t('leaderboard.competingNow')}</p>
          </Card>
        </div>
        </Container>
      </main>
    </div>
  )
}
