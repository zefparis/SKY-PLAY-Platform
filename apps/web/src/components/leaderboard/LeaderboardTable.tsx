import { Trophy, Medal } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  username: string
  wins: number
  earnings: number
  avatar?: string
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

const LeaderboardTable = ({ entries }: LeaderboardTableProps) => {
  const formatCompactEarnings = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M XOF`
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K XOF`
    }

    return formatCurrency(value)
  }

  const getRankIcon = (rank: number) => {
    // Strict palette: use electric blue for top ranks and accent red for #1 highlight
    if (rank === 1) return <Trophy className="w-6 h-6 text-accent" />
    if (rank === 2) return <Medal className="w-6 h-6 text-secondary" />
    if (rank === 3) return <Medal className="w-6 h-6 text-secondary" />
    return <span className="text-primary/70 dark:text-white/65 font-bold">#{rank}</span>
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-accent/18 to-transparent border-accent/25'
    if (rank === 2) return 'bg-gradient-to-r from-secondary/18 to-transparent border-secondary/25'
    if (rank === 3) return 'bg-gradient-to-r from-secondary/12 to-transparent border-secondary/20'
    return 'bg-white/40 dark:bg-white/5 border-primary/10 dark:border-white/10'
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.rank}
          className={`rounded-lg border p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] ${getRankBg(entry.rank)}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4 sm:flex-1">
              <div className="flex w-10 shrink-0 items-center justify-center sm:w-12">
                {getRankIcon(entry.rank)}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white sm:h-12 sm:w-12 sm:text-base">
                {entry.avatar || entry.username.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-primary dark:text-white sm:text-base">
                  {entry.username}
                </h3>
                <p className="text-xs text-primary/70 dark:text-white/65 sm:text-sm">{entry.wins} wins</p>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 border-t border-primary/10 dark:border-white/10 pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary/60 dark:text-white/45 sm:hidden">
                Total Earnings
              </p>
              <div className="min-w-0 sm:max-w-[180px]">
                <p className="truncate text-sm font-bold text-secondary tabular-nums sm:text-lg">
                  <span className="sm:hidden">{formatCompactEarnings(entry.earnings)}</span>
                  <span className="hidden sm:inline">{formatCurrency(entry.earnings)}</span>
                </p>
                <p className="hidden text-xs text-primary/70 dark:text-white/60 sm:block">Total Earnings</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardTable
