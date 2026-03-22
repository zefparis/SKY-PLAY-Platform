import Navbar from '@/components/layout/Navbar'
import WalletCard from '@/components/wallet/WalletCard'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import Card from '@/components/ui/Card'
import { Trophy, Gamepad2, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
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
    { label: 'Total Wins', value: '12', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Active Challenges', value: '3', icon: Gamepad2, color: 'text-secondary' },
    { label: 'Win Rate', value: '68%', icon: TrendingUp, color: 'text-green-400' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WalletCard balance={125000} />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {mockStats.map((stat, i) => (
              <Card key={i} className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg bg-dark-200 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Active Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recent Matches</h2>
          <Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-dark-200 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">FIFA 24 1v1</p>
                      <p className="text-sm text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                    Won
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
