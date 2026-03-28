'use client'

import { useState, useEffect } from 'react'
import { Users, MessageCircle, Trophy } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import UserCard from './UserCard'

type Friend = {
  id: string
  username: string
  avatar?: string
  status: string
  level: number
}

export default function FriendsList() {
  const tokens = useAuthStore((state) => state.tokens)
  const [friends, setFriends] = useState<Friend[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!tokens?.idToken) return

    const fetchFriends = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${tokens.idToken}`,
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          setFriends(data || [])
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error)
      }
    }

    fetchFriends()
  }, [tokens?.idToken])

  if (!tokens) return null

  const onlineFriends = friends.filter((f) => f.status === 'ONLINE')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition"
      >
        <Users className="h-5 w-5 text-white/70" />
        {onlineFriends.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
            {onlineFriends.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-[#00165F] border border-white/10 shadow-xl max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">
                Amis ({friends.length})
              </h3>
              <p className="text-xs text-white/60 mt-1">
                {onlineFriends.length} en ligne
              </p>
            </div>

            {friends.length === 0 ? (
              <div className="p-8 text-center text-white/50 text-sm">
                Aucun ami pour le moment
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {friends.map((friend) => (
                  <UserCard
                    key={friend.id}
                    user={friend}
                    friendshipStatus="ACCEPTED"
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
