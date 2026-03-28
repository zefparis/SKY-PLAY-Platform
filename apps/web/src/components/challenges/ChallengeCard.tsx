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
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-[#00165F] group-hover:text-secondary transition-colors truncate">
              {challenge.title}
            </h3>
            <p className="text-xs sm:text-sm dark:text-white/65 text-[#00165F]/65 truncate">{challenge.game}</p>
          </div>
        </div>
        <Badge variant={challenge.status === 'OPEN' ? 'success' : 'danger'} className="shrink-0">
          {challenge.status}
        </Badge>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 dark:text-white/65 text-[#00165F]/65">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Players</span>
          </div>
          <span className="text-sm sm:text-base dark:text-white text-[#00165F] font-semibold">
            {challenge.currentPlayers}/{challenge.maxPlayers}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 dark:text-white/65 text-[#00165F]/65">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Prize Pool</span>
          </div>
          <span className="text-sm sm:text-base text-secondary font-bold">
            {formatCurrency(challenge.prizePool)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="dark:text-white/65 text-[#00165F]/65 text-xs sm:text-sm">Entry Fee</span>
          <span className="text-sm sm:text-base dark:text-white text-[#00165F] font-semibold">
            {formatCurrency(challenge.entryFee)}
          </span>
        </div>
      </div>

      <div className="pt-3 sm:pt-4 border-t dark:border-white/10 border-[#00165F]/10">
        <Button variant="primary" className="w-full text-sm sm:text-base" disabled={challenge.status !== 'OPEN'}>
          {challenge.status === 'OPEN' ? (
            <>
              <span className="hidden sm:inline">Join Challenge ({spotsLeft} spots left)</span>
              <span className="sm:hidden">Join ({spotsLeft} left)</span>
            </>
          ) : 'Full'}
        </Button>
      </div>
    </Card>
  )
}

export default ChallengeCard
