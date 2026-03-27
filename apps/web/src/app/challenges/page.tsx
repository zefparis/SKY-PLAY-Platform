import ChallengeCard from '@/components/challenges/ChallengeCard'
import Button from '@/components/ui/Button'
import { Plus, Filter } from 'lucide-react'
import Container from '@/components/ui/Container'

export default function ChallengesPage() {
  const mockChallenges = [
    {
      id: '1',
      title: 'FIFA 24 1v1 Championship',
      game: 'FIFA 24',
      entryFee: 5000,
      prizePool: 45000,
      maxPlayers: 10,
      currentPlayers: 7,
      status: 'OPEN',
    },
    {
      id: '2',
      title: 'COD Warzone Squad Battle',
      game: 'Call of Duty',
      entryFee: 10000,
      prizePool: 90000,
      maxPlayers: 8,
      currentPlayers: 8,
      status: 'FULL',
    },
    {
      id: '3',
      title: 'Fortnite Solo Tournament',
      game: 'Fortnite',
      entryFee: 7500,
      prizePool: 67500,
      maxPlayers: 12,
      currentPlayers: 5,
      status: 'OPEN',
    },
    {
      id: '4',
      title: 'Valorant 5v5 Pro League',
      game: 'Valorant',
      entryFee: 15000,
      prizePool: 135000,
      maxPlayers: 10,
      currentPlayers: 9,
      status: 'OPEN',
    },
    {
      id: '5',
      title: 'Rocket League 2v2',
      game: 'Rocket League',
      entryFee: 6000,
      prizePool: 54000,
      maxPlayers: 8,
      currentPlayers: 3,
      status: 'OPEN',
    },
    {
      id: '6',
      title: 'League of Legends Clash',
      game: 'League of Legends',
      entryFee: 12000,
      prizePool: 108000,
      maxPlayers: 10,
      currentPlayers: 10,
      status: 'FULL',
    },
  ]

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Challenges</h1>
              <p className="text-sm sm:text-base text-white/65">Join a challenge and compete for prizes</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Filter className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
        </Container>
      </main>
    </div>
  )
}
