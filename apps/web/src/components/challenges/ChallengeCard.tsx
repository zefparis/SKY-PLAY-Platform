import { Users, Trophy, Gamepad2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface ChallengeCardProps {
  challenge: {
    id: string
    title: string
    game: string
    entryFee: number
    prizePool: number
    maxPlayers: number
    currentPlayers: number
    status: string
  }
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const spotsLeft = challenge.maxPlayers - challenge.currentPlayers

  return (
    <Card glow className="group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-secondary transition-colors">
              {challenge.title}
            </h3>
            <p className="text-sm text-gray-400">{challenge.game}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          challenge.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {challenge.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">Players</span>
          </div>
          <span className="text-white font-semibold">
            {challenge.currentPlayers}/{challenge.maxPlayers}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Prize Pool</span>
          </div>
          <span className="text-secondary font-bold">
            {formatCurrency(challenge.prizePool)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Entry Fee</span>
          <span className="text-white font-semibold">
            {formatCurrency(challenge.entryFee)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-dark-200">
        <Button variant="primary" className="w-full" disabled={challenge.status !== 'OPEN'}>
          {challenge.status === 'OPEN' ? `Join Challenge (${spotsLeft} spots left)` : 'Full'}
        </Button>
      </div>
    </Card>
  )
}

export default ChallengeCard
