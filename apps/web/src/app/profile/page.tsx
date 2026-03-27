import RequireAuth from '@/features/auth/RequireAuth'
import Container from '@/components/ui/Container'
import ProfileHeader from '@/components/profile/ProfileHeader'
import StatsGrid from '@/components/profile/StatsGrid'
import MatchHistory from '@/components/profile/MatchHistory'
import Achievements from '@/components/profile/Achievements'

export default function ProfilePage() {
  const username = 'SkyMaster'
  const rank = 'Diamond'

  const stats = {
    gamesPlayed: 128,
    wins: 84,
    losses: 44,
    winRate: 66,
  }

  const matches = [
    { id: '1', game: 'FIFA 24', opponent: 'ProGamer123', result: 'WIN' as const, date: 'Today 21:12' },
    { id: '2', game: 'Valorant', opponent: 'TopFragger', result: 'LOSS' as const, date: 'Yesterday 18:40' },
    { id: '3', game: 'COD Warzone', opponent: 'ClutchMaster', result: 'WIN' as const, date: 'Mar 21 14:05' },
    { id: '4', game: 'Rocket League', opponent: 'NinjaWarrior', result: 'WIN' as const, date: 'Mar 20 22:10' },
  ]

  const achievements = [
    {
      id: 'a1',
      title: 'First Blood',
      description: 'Win your first match on SKY PLAY.',
    },
    {
      id: 'a2',
      title: 'Win Streak',
      description: 'Win 5 matches in a row.',
      highlight: true,
    },
    {
      id: 'a3',
      title: 'Challenger',
      description: 'Join 10 challenges.',
    },
    {
      id: 'a4',
      title: 'High Roller',
      description: 'Win a prize pool over 100k.',
      highlight: true,
    },
    {
      id: 'a5',
      title: 'Consistent',
      description: 'Maintain >60% winrate over 50 games.',
    },
    {
      id: 'a6',
      title: 'Arena Ready',
      description: 'Complete your profile and link a gaming account.',
    },
  ]

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <main className="pb-12">
          <Container>
            <div className="space-y-6 sm:space-y-8">
              <ProfileHeader username={username} rank={rank} />
              <StatsGrid stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <MatchHistory matches={matches} />
                <Achievements achievements={achievements} />
              </div>
            </div>
          </Container>
        </main>
      </div>
    </RequireAuth>
  )
}
