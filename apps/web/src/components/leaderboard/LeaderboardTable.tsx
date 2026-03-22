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
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />
    return <span className="text-gray-400 font-bold">#{rank}</span>
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/20 to-transparent border-gray-300/30'
    if (rank === 3) return 'bg-gradient-to-r from-orange-500/20 to-transparent border-orange-500/30'
    return 'bg-dark-100 border-dark-200'
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
              <p className="text-sm text-gray-400">{entry.wins} wins</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-secondary font-bold text-lg">
              {formatCurrency(entry.earnings)}
            </p>
            <p className="text-xs text-gray-400">Total Earnings</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardTable
