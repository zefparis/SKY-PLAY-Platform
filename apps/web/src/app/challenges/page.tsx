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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Challenges</h1>
            <p className="text-white/65">Join a challenge and compete for prizes</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
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
