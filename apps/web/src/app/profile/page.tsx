'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/features/auth/RequireAuth'
import Container from '@/components/ui/Container'
import { useAuthStore } from '@/lib/auth-store'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload'
import ProfileEditForm from '@/components/profile/ProfileEditForm'
import LinkedAccountsCard from '@/components/profile/LinkedAccountsCard'
import ProfileWallet from '@/components/profile/ProfileWallet'
import ProfileRanking from '@/components/profile/ProfileRanking'
import StatsGrid from '@/components/profile/StatsGrid'
import MatchHistory from '@/components/profile/MatchHistory'
import Achievements from '@/components/profile/Achievements'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'
import DepositModal from '@/components/wallet/DepositModal'
import WithdrawModal from '@/components/wallet/WithdrawModal'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function mapTxType(type: string): 'deposit' | 'withdraw' | 'win' | 'loss' {
  switch (type) {
    case 'DEPOSIT': return 'deposit'
    case 'WITHDRAWAL': case 'WITHDRAW': return 'withdraw'
    case 'CHALLENGE_CREDIT': case 'CHALLENGE_WIN': return 'win'
    default: return 'loss'
  }
}

function getRankName(level: number): string {
  if (level >= 50) return 'Legend'
  if (level >= 40) return 'Grand Master'
  if (level >= 30) return 'Master'
  if (level >= 20) return 'Diamond'
  if (level >= 10) return 'Gold'
  if (level >= 5) return 'Silver'
  return 'Bronze'
}

export default function ProfilePage() {
  const { t } = useI18n()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const tokens = useAuthStore((s) => s.tokens)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [walletData, setWalletData] = useState<any>(null)
  const [challengeData, setChallengeData] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const username = user?.username || 'Player'
  const token = tokens?.idToken || tokens?.accessToken

  const loadData = useCallback(async () => {
    if (!user || !token) { setLoading(false); return }
    const auth = { Authorization: `Bearer ${token}` }
    try {
      const [profileRes, walletRes, challengesRes, lbRes] = await Promise.allSettled([
        fetch(`${API}/users/${username}`),
        fetch(`${API}/wallet`, { headers: auth }),
        fetch(`${API}/challenges/my`, { headers: auth }),
        fetch(`${API}/users/leaderboard?limit=100`),
      ])
      if (profileRes.status === 'fulfilled' && profileRes.value.ok)
        setProfileData(await profileRes.value.json())
      if (walletRes.status === 'fulfilled' && walletRes.value.ok)
        setWalletData(await walletRes.value.json())
      if (challengesRes.status === 'fulfilled' && challengesRes.value.ok)
        setChallengeData(await challengesRes.value.json())
      if (lbRes.status === 'fulfilled' && lbRes.value.ok)
        setLeaderboard(await lbRes.value.json())
    } catch {}
    finally { setLoading(false) }
  }, [user, token, username])

  useEffect(() => { loadData() }, [loadData])

  // ── Query-param toast (OAuth callbacks) ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const steam   = params.get('steam')
    const epic    = params.get('epic')
    const youtube = params.get('youtube')
    const reason  = params.get('reason')

    let handled = false

    if (steam === 'linked') {
      setToast({ message: 'Compte Steam lié !', type: 'success' })
      handled = true
    } else if (steam === 'error') {
      setToast({ message: 'Erreur Steam, réessaie', type: 'error' })
      handled = true
    } else if (epic === 'linked') {
      setToast({ message: 'Compte Epic Games lié !', type: 'success' })
      handled = true
    } else if (youtube === 'linked') {
      useAuthStore.getState().restoreSession()
      setToast({ message: 'Compte YouTube connecté avec succès !', type: 'success' })
      handled = true
    } else if (youtube === 'error') {
      const messages: Record<string, string> = {
        no_channel: "Ce compte Google n'a pas de chaîne YouTube. Crée une chaîne sur youtube.com puis réessaie.",
        exchange_failed: 'Échec de connexion YouTube. Réessaie ou contacte le support.',
        access_denied: 'Connexion YouTube annulée.',
        invalid_state: 'Session OAuth invalide. Réessaie la connexion.',
        missing_params: 'Paramètres OAuth manquants. Réessaie.',
      }
      setToast({
        message: messages[reason ?? ''] ?? 'Erreur inconnue lors de la connexion YouTube.',
        type: 'error',
      })
      handled = true
    }

    if (handled) {
      router.replace('/profile', { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // ── Derived data ──────────────────────────────────────────────────────────
  const gamesPlayed = profileData?.gamesPlayed ?? 0
  const wins        = profileData?.gamesWon ?? 0
  const losses      = Math.max(0, gamesPlayed - wins)
  const winRate     = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0
  const level       = profileData?.level ?? 1
  const xp          = profileData?.xp ?? 0
  const stats       = { gamesPlayed, wins, losses, winRate }

  const balance  = walletData?.balance ?? 0
  const recentTx = (walletData?.recentTransactions ?? []).map((tx: any) => ({
    id: tx.id,
    type: mapTxType(tx.type),
    amount: Math.abs(Number(tx.amount)),
    description: tx.description ?? tx.type,
    date: new Date(tx.createdAt).toLocaleDateString(),
  }))

  const lbArray    = Array.isArray(leaderboard) ? leaderboard : []
  const myRankIdx  = lbArray.findIndex((p: any) => p.id === user?.id || p.username === username)
  const globalRank = myRankIdx >= 0 ? myRankIdx + 1 : 0
  const rankName   = getRankName(level)
  const rankingData = {
    globalRank,
    totalPlayers: lbArray.length,
    rankName,
    points: xp,
    nextRankPoints: (level + 1) * 500,
  }

  const allChallenges = [
    ...(challengeData?.created ?? []),
    ...(challengeData?.participated ?? []),
  ]
  const unique = Array.from(new Map(allChallenges.map((c: any) => [c.id, c])).values())
  const matches = unique
    .filter((c: any) => c.status === 'COMPLETED' || c.status === 'RESOLVED' || c.winnerId)
    .slice(0, 5)
    .map((c: any) => ({
      id: c.id,
      game: c.game ?? c.title ?? '—',
      opponent: '—',
      result: (c.winnerId === user?.id ? 'WIN' : 'LOSS') as 'WIN' | 'LOSS',
      date: new Date(c.updatedAt ?? c.createdAt).toLocaleDateString(),
    }))

  const achievements = (profileData?.achievements ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    highlight: false,
  }))

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePhotoChange = async (file: File) => {
    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/users/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const result = await res.json()
      useAuthStore.setState({ user: result.user })
    } catch (error: unknown) {
      console.error('Erreur upload photo:', error)
      throw error
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleProfileSave = async (data: any) => {
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Save failed')
      const updatedUser = await res.json()
      useAuthStore.setState({ user: updatedUser })
    } catch (error: unknown) {
      console.error('Erreur sauvegarde profil:', error)
      throw error
    }
  }

  return (
    <RequireAuth>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      <div className="min-h-screen">
        <main className="pb-12">
          <Container>
            <div className="space-y-6 sm:space-y-8">
              {/* Header */}
              <Card variant="glass" className="flex flex-col sm:flex-row sm:items-start gap-6">
                <ProfilePhotoUpload
                  username={username}
                  currentPhoto={user?.avatar || undefined}
                  onPhotoChange={handlePhotoChange}
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h1 className="title-tech dark:text-white text-[#00165F] text-3xl font-extrabold">{username}</h1>
                    </div>
                    <Badge variant="danger">{rankName}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: t('stats.games'),   value: stats.gamesPlayed },
                      { label: t('stats.wins'),    value: stats.wins },
                      { label: t('stats.losses'),  value: stats.losses },
                      { label: t('stats.winrate'), value: `${stats.winRate}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="dark:bg-black/20 bg-[#00165F]/5 rounded-lg p-3 border dark:border-white/5 border-[#00165F]/10">
                        <p className="dark:text-white/60 text-[#00165F]/60 text-xs mb-1">{label}</p>
                        <p className="dark:text-white text-[#00165F] text-xl font-bold">{loading ? '…' : value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Wallet & Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ProfileWallet
                  balance={balance}
                  transactions={recentTx}
                  onDeposit={() => setShowDeposit(true)}
                  onWithdraw={() => setShowWithdraw(true)}
                />
                <ProfileRanking ranking={rankingData} />
              </div>

              {/* Edit form */}
              <ProfileEditForm
                initialData={{
                  username,
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  bio: user?.bio || '',
                  discordTag: user?.discordTag || '',
                  twitchUsername: user?.twitchUsername || '',
                  country: user?.country || '',
                  city: user?.city || '',
                  phone: user?.phone || '',
                  nationality: user?.nationality || '',
                }}
                onSave={handleProfileSave}
              />

              {/* Linked gaming accounts */}
              <LinkedAccountsCard />

              {/* Stats grid */}
              <StatsGrid stats={stats} />

              {/* Match history & Achievements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <MatchHistory matches={matches} />
                <Achievements achievements={achievements} />
              </div>
            </div>
          </Container>
        </main>
      </div>
      {showDeposit && (
        <DepositModal onClose={() => setShowDeposit(false)} onSuccess={() => { setShowDeposit(false); loadData() }} />
      )}
      {showWithdraw && (
        <WithdrawModal balance={balance} onClose={() => setShowWithdraw(false)} onSuccess={() => { setShowWithdraw(false); loadData() }} />
      )}
    </RequireAuth>
  )
}
