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
        <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary glow-blue sm:h-16 sm:w-16">
            <Trophy className="h-6 w-6 text-white sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-primary dark:text-white sm:text-4xl">{t('leaderboard.title')}</h1>
            <p className="text-sm text-primary/70 dark:text-white/65 sm:text-base">{t('leaderboard.subtitle')}</p>
          </div>
        </div>

        <Card>
          <LeaderboardTable entries={mockLeaderboard} />
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto mb-4 shadow-glow-red">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="truncate text-xl font-bold text-primary dark:text-white mb-2 sm:text-2xl">ProGamer123</h3>
            <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.topPlayer')}</p>
            <p className="text-2xl font-bold text-gradient sm:text-3xl">45 {t('leaderboard.wins')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="break-words text-xl font-bold text-primary dark:text-white mb-2 tabular-nums sm:text-2xl">2.5M XOF</h3>
            <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.highestEarnings')}</p>
            <p className="text-base text-secondary font-semibold sm:text-lg">{t('leaderboard.thisMonth')}</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-primary dark:text-white mb-2 tabular-nums sm:text-2xl">156</h3>
            <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.activePlayers')}</p>
            <p className="text-base text-accent font-semibold sm:text-lg">{t('leaderboard.competingNow')}</p>
          </Card>
        </div>
        </Container>
      </main>
    </div>
  )
}
