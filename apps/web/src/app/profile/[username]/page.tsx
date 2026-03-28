'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trophy, Calendar, Target, Shield, UserPlus, UserCheck, Ban } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type Achievement = {
  id: string
  type: string
  title: string
  description: string
  icon: string
  unlockedAt: string
}

type UserProfile = {
  id: string
  username: string
  avatar?: string
  bio?: string
  level: number
  xp: number
  fairPlayScore: number
  gamesPlayed: number
  gamesWon: number
  status: string
  lastSeen?: string
  createdAt: string
  achievements: Achievement[]
  friendshipStatus: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const tokens = useAuthStore((state) => state.tokens)
  const currentUser = useAuthStore((state) => state.user)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const username = params.username as string

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers: HeadersInit = {}
        if (tokens?.idToken) {
          headers.Authorization = `Bearer ${tokens.idToken}`
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/users/${username}`,
          { headers },
        )

        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username, tokens?.idToken, router])

  const handleAddFriend = async () => {
    if (!tokens?.idToken || !profile) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/request/${profile.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setProfile({ ...profile, friendshipStatus: 'PENDING_SENT' })
    } catch (error) {
      console.error('Failed to send friend request:', error)
    }
  }

  const handleRemoveFriend = async () => {
    if (!tokens?.idToken || !profile) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/${profile.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setProfile({ ...profile, friendshipStatus: 'NONE' })
    } catch (error) {
      console.error('Failed to remove friend:', error)
    }
  }

  const handleBlock = async () => {
    if (!tokens?.idToken || !profile) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/block/${profile.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setProfile({ ...profile, friendshipStatus: 'BLOCKED_BY_YOU' })
    } catch (error) {
      console.error('Failed to block user:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const winrate = profile.gamesPlayed > 0 ? ((profile.gamesWon / profile.gamesPlayed) * 100).toFixed(1) : '0'
  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-[#0a0f1e] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl bg-[#00165F] border border-white/10 p-8 mb-6">
          <div className="flex items-start gap-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="h-24 w-24 rounded-full object-cover border-4 border-sky-400"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-sky-400">
                {profile.username[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
                <div className="px-3 py-1 rounded-full bg-sky-400/20 text-sky-400 text-sm font-semibold">
                  Niveau {profile.level}
                </div>
              </div>

              {profile.bio && (
                <p className="text-white/70 mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Fair-play: {profile.fairPlayScore.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && tokens && (
              <div className="flex gap-2">
                {profile.friendshipStatus === 'NONE' && (
                  <button
                    onClick={handleAddFriend}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-400 text-white font-semibold hover:bg-sky-500 transition"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter
                  </button>
                )}
                {profile.friendshipStatus === 'ACCEPTED' && (
                  <button
                    onClick={handleRemoveFriend}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400 text-white font-semibold hover:bg-emerald-500 transition"
                  >
                    <UserCheck className="h-4 w-4" />
                    Ami
                  </button>
                )}
                {profile.friendshipStatus === 'PENDING_SENT' && (
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/50 font-semibold cursor-not-allowed"
                  >
                    En attente
                  </button>
                )}
                <button
                  onClick={handleBlock}
                  className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition"
                  title="Bloquer"
                >
                  <Ban className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl bg-[#00165F] border border-white/10 p-6 text-center">
            <Target className="h-8 w-8 text-sky-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{profile.gamesPlayed}</p>
            <p className="text-sm text-white/60">Parties jouées</p>
          </div>

          <div className="rounded-xl bg-[#00165F] border border-white/10 p-6 text-center">
            <Trophy className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{profile.gamesWon}</p>
            <p className="text-sm text-white/60">Victoires</p>
          </div>

          <div className="rounded-xl bg-[#00165F] border border-white/10 p-6 text-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold mx-auto mb-2">
              %
            </div>
            <p className="text-3xl font-bold text-white mb-1">{winrate}%</p>
            <p className="text-sm text-white/60">Taux de victoire</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#00165F] border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-sky-400" />
            Succès débloqués ({profile.achievements.length})
          </h2>

          {profile.achievements.length === 0 ? (
            <p className="text-white/50 text-center py-8">Aucun succès débloqué pour le moment</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{achievement.title}</p>
                    <p className="text-xs text-white/60">{achievement.description}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
