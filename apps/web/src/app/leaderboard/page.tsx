import Navbar from '@/components/layout/Navbar'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import Card from '@/components/ui/Card'
import { Trophy } from 'lucide-react'

export default function LeaderboardPage() {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center glow-blue">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
            <p className="text-gray-400">Top players on SKY PLAY</p>
          </div>
        </div>

        <Card>
          <LeaderboardTable entries={mockLeaderboard} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">ProGamer123</h3>
            <p className="text-gray-400 mb-4">Top Player</p>
            <p className="text-3xl font-bold text-gradient">45 Wins</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">2.5M XOF</h3>
            <p className="text-gray-400 mb-4">Highest Earnings</p>
            <p className="text-lg text-secondary font-semibold">This Month</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">156</h3>
            <p className="text-gray-400 mb-4">Active Players</p>
            <p className="text-lg text-accent font-semibold">Competing Now</p>
          </Card>
        </div>
      </main>
    </div>
  )
}
