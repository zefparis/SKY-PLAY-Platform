'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type FriendRequest = {
  id: string
  username: string
  avatar?: string
  level: number
  requestedAt: string
}

export default function FriendRequests() {
  const tokens = useAuthStore((state) => state.tokens)
  const [requests, setRequests] = useState<FriendRequest[]>([])

  const fetchRequests = async () => {
    if (!tokens?.idToken) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/pending`,
        {
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setRequests(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [tokens?.idToken])

  const handleAccept = async (userId: string) => {
    if (!tokens?.idToken) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/accept/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setRequests((prev) => prev.filter((r) => r.id !== userId))
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  const handleDecline = async (userId: string) => {
    if (!tokens?.idToken) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/friendships/decline/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setRequests((prev) => prev.filter((r) => r.id !== userId))
    } catch (error) {
      console.error('Failed to decline friend request:', error)
    }
  }

  if (!tokens || requests.length === 0) return null

  return (
    <div className="rounded-xl bg-[#00165F] border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white mb-4">
        Demandes d'ami ({requests.length})
      </h3>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {request.username[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {request.username}
              </p>
              <p className="text-xs text-white/60">Niveau {request.level}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id)}
                className="p-2 rounded-lg bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 transition"
                title="Accepter"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDecline(request.id)}
                className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition"
                title="Refuser"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
