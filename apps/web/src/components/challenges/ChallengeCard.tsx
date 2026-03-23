import { Users, Trophy, Gamepad2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

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
            <p className="text-sm text-white/65">{challenge.game}</p>
          </div>
        </div>
        <Badge variant={challenge.status === 'OPEN' ? 'success' : 'danger'}>
          {challenge.status}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white/65">
            <Users className="w-4 h-4" />
            <span className="text-sm">Players</span>
          </div>
          <span className="text-white font-semibold">
            {challenge.currentPlayers}/{challenge.maxPlayers}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white/65">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Prize Pool</span>
          </div>
          <span className="text-secondary font-bold">
            {formatCurrency(challenge.prizePool)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/65 text-sm">Entry Fee</span>
          <span className="text-white font-semibold">
            {formatCurrency(challenge.entryFee)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <Button variant="primary" className="w-full" disabled={challenge.status !== 'OPEN'}>
          {challenge.status === 'OPEN' ? `Join Challenge (${spotsLeft} spots left)` : 'Full'}
        </Button>
      </div>
    </Card>
  )
}

export default ChallengeCard
