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
  const getRankIcon = (rank: number) => {
    // Strict palette: use electric blue for top ranks and accent red for #1 highlight
    if (rank === 1) return <Trophy className="w-6 h-6 text-accent" />
    if (rank === 2) return <Medal className="w-6 h-6 text-secondary" />
    if (rank === 3) return <Medal className="w-6 h-6 text-secondary" />
    return <span className="text-white/65 font-bold">#{rank}</span>
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-accent/18 to-transparent border-accent/25'
    if (rank === 2) return 'bg-gradient-to-r from-secondary/18 to-transparent border-secondary/25'
    if (rank === 3) return 'bg-gradient-to-r from-secondary/12 to-transparent border-secondary/20'
    return 'bg-white/5 border-white/10'
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.rank}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${getRankBg(entry.rank)}`}
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
              {entry.avatar || entry.username.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h3 className="text-white font-semibold">{entry.username}</h3>
              <p className="text-sm text-white/65">{entry.wins} wins</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-secondary font-bold text-lg">
              {formatCurrency(entry.earnings)}
            </p>
            <p className="text-xs text-white/60">Total Earnings</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardTable
