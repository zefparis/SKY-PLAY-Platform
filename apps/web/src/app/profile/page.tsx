'use client'

import { useState } from 'react'
import RequireAuth from '@/features/auth/RequireAuth'
import Container from '@/components/ui/Container'
import { useAuthStore } from '@/lib/auth-store'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload'
import ProfileEditForm from '@/components/profile/ProfileEditForm'
import ProfileWallet from '@/components/profile/ProfileWallet'
import ProfileRanking from '@/components/profile/ProfileRanking'
import StatsGrid from '@/components/profile/StatsGrid'
import MatchHistory from '@/components/profile/MatchHistory'
import Achievements from '@/components/profile/Achievements'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Données utilisateur réelles ou par défaut
  const username = user?.username || 'Player'
  const email = user?.email || ''
  const rank = 'Diamond' // TODO: récupérer depuis l'API

  // Stats du joueur (TODO: récupérer depuis l'API)
  const stats = {
    gamesPlayed: 128,
    wins: 84,
    losses: 44,
    winRate: 66,
  }

  // Données du wallet (TODO: récupérer depuis l'API)
  const walletData = {
    balance: 15750,
    transactions: [
      { id: '1', type: 'win' as const, amount: 500, description: 'Victoire FIFA 24', date: "Aujourd'hui 21:12" },
      { id: '2', type: 'deposit' as const, amount: 1000, description: 'Dépôt', date: 'Hier 14:30' },
      { id: '3', type: 'loss' as const, amount: 250, description: 'Défaite Valorant', date: 'Mar 21 18:40' },
      { id: '4', type: 'win' as const, amount: 750, description: 'Victoire COD Warzone', date: 'Mar 20 22:10' },
    ],
  }

  // Données de classement (TODO: récupérer depuis l'API)
  const rankingData = {
    globalRank: 342,
    totalPlayers: 15420,
    rankName: 'Diamond',
    points: 2850,
    nextRankPoints: 3500,
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

  // Handlers
  const handlePhotoChange = async (file: File) => {
    setIsUploadingPhoto(true)
    try {
      const tokens = useAuthStore.getState().tokens
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.idToken || tokens?.accessToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de l\'upload')
      }

      const result = await response.json()
      
      // Mettre à jour le store avec le nouvel avatar
      useAuthStore.setState({ user: result.user })
      
      alert('Photo de profil mise à jour avec succès !')
    } catch (error: unknown) {
      console.error('Erreur upload photo:', error)
      throw error
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleProfileSave = async (data: any) => {
    try {
      const tokens = useAuthStore.getState().tokens
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.idToken || tokens?.accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la sauvegarde')
      }

      const updatedUser = await response.json()
      
      // Mettre à jour le store avec les nouvelles données
      useAuthStore.setState({ user: updatedUser })
      
      alert('Profil mis à jour avec succès !')
    } catch (error: unknown) {
      console.error('Erreur sauvegarde profil:', error)
      throw error
    }
  }

  const handleDeposit = () => {
    // TODO: Ouvrir modal de dépôt
    console.log('Deposit')
  }

  const handleWithdraw = () => {
    // TODO: Ouvrir modal de retrait
    console.log('Withdraw')
  }

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <main className="pb-12">
          <Container>
            <div className="space-y-6 sm:space-y-8">
              {/* Header avec photo de profil */}
              <Card variant="glass" className="flex flex-col sm:flex-row sm:items-start gap-6">
                <ProfilePhotoUpload
                  username={username}
                  currentPhoto={user?.avatar || undefined}
                  onPhotoChange={handlePhotoChange}
                />
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h1 className="title-tech text-white text-3xl font-extrabold">{username}</h1>
                      <p className="text-white/60 mt-1">{email}</p>
                    </div>
                    <Badge variant="danger">{rank}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/60 text-xs mb-1">Matchs</p>
                      <p className="text-white text-xl font-bold">{stats.gamesPlayed}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/60 text-xs mb-1">Victoires</p>
                      <p className="text-white text-xl font-bold">{stats.wins}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/60 text-xs mb-1">Défaites</p>
                      <p className="text-white text-xl font-bold">{stats.losses}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/60 text-xs mb-1">Winrate</p>
                      <p className="text-white text-xl font-bold">{stats.winRate}%</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Wallet et Classement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ProfileWallet
                  balance={walletData.balance}
                  transactions={walletData.transactions}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                />
                <ProfileRanking ranking={rankingData} />
              </div>

              {/* Formulaire d'édition du profil */}
              <ProfileEditForm
                initialData={{
                  username,
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  bio: user?.bio || '',
                  discordTag: user?.discordTag || '',
                  twitchUsername: user?.twitchUsername || '',
                }}
                onSave={handleProfileSave}
              />

              {/* Stats détaillées */}
              <StatsGrid stats={stats} />

              {/* Historique et Achievements */}
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
