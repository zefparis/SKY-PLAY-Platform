"use client"

import { useEffect, useState } from 'react'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import Card from '@/components/ui/Card'
import { Trophy, Users, Star } from 'lucide-react'
import Container from '@/components/ui/Container'
import { useI18n } from '@/components/i18n/I18nProvider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface ApiPlayer {
  id: string
  username: string
  avatar: string | null
  level: number
  xp: number
  gamesWon: number
  gamesPlayed: number
}

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [players, setPlayers] = useState<ApiPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/users/leaderboard?limit=50`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiPlayer[]) => setPlayers(Array.isArray(data) ? data : []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false))
  }, [])

  const entries = players.map((p, i) => ({
    rank: i + 1,
    username: p.username,
    wins: p.gamesWon,
    earnings: p.xp,
    avatar: p.avatar ?? undefined,
  }))

  const top = players[0]

  const formatXp = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K XP` : `${v} XP`

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
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
                <span className="text-sm text-primary/60 dark:text-white/50">{t('leaderboard.loading')}</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Trophy className="w-12 h-12 text-primary/20 dark:text-white/20" />
                <p className="text-primary/50 dark:text-white/50">{t('leaderboard.noData')}</p>
              </div>
            ) : (
              <LeaderboardTable
                entries={entries}
                scoreLabel={t('leaderboard.score')}
                formatScore={formatXp}
              />
            )}
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
            <Card className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto mb-4 shadow-glow-red">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
              <h3 className="truncate text-xl font-bold text-primary dark:text-white mb-2 sm:text-2xl">
                {top?.username ?? '—'}
              </h3>
              <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.topPlayer')}</p>
              <p className="text-2xl font-bold text-gradient sm:text-3xl">
                {top ? `${top.gamesWon} ${t('leaderboard.wins')}` : '—'}
              </p>
            </Card>

            <Card className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="break-words text-xl font-bold text-primary dark:text-white mb-2 tabular-nums sm:text-2xl">
                {top ? formatXp(top.xp) : '—'}
              </h3>
              <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.score')}</p>
              <p className="text-base text-secondary font-semibold sm:text-lg">{t('leaderboard.topPlayer')}</p>
            </Card>

            <Card className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-white mb-2 tabular-nums sm:text-2xl">
                {loading ? '…' : players.length}
              </h3>
              <p className="text-primary/70 dark:text-white/65 mb-4">{t('leaderboard.registeredPlayers')}</p>
              <p className="text-base text-accent font-semibold sm:text-lg">{t('leaderboard.competingNow')}</p>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  )
}
