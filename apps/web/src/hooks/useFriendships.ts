import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { io, Socket } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type FriendStatus = 'ONLINE' | 'AWAY' | 'IN_GAME' | 'OFFLINE'

export interface Friend {
  id: string
  username: string
  avatar?: string
  status: FriendStatus
  lastSeen?: string
}

export interface FriendRequest {
  id: string
  senderId: string
  sender: {
    id: string
    username: string
    avatar?: string
  }
  createdAt: string
}

export interface FriendSuggestion {
  id: string
  username: string
  avatar?: string
  mutualFriends: number
  commonChallenges: number
}

export interface FriendshipStatus {
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' | 'BLOCKED'
  canSendRequest: boolean
}

export function useFriendships() {
  const tokens = useAuthStore((state) => state.tokens)
  const initialized = useAuthStore((state) => state.initialized)
  
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch friends list — API returns a flat array of friends (mapped on backend)
  const fetchFriends = useCallback(async () => {
    if (!tokens?.idToken) return

    try {
      const res = await fetch(`${API}/friendships`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : (data.friends || [])
        setFriends(arr)
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    }
  }, [tokens?.idToken])

  // Fetch pending requests — API returns a flat array with sender fields + requestId/requestedAt
  const fetchPendingRequests = useCallback(async () => {
    if (!tokens?.idToken) return

    try {
      const res = await fetch(`${API}/friendships/pending`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        const arr: any[] = Array.isArray(data) ? data : (data.requests || [])
        // Normalize backend shape `{id, username, avatar, requestId, requestedAt, ...}`
        // into the UI-facing shape `{id, senderId, sender, createdAt}`
        const normalized: FriendRequest[] = arr.map((r) => ({
          id: r.requestId ?? r.id,
          senderId: r.id,
          sender: { id: r.id, username: r.username, avatar: r.avatar },
          createdAt: r.requestedAt ?? r.createdAt ?? new Date().toISOString(),
        }))
        setPendingRequests(normalized)
      }
    } catch (err) {
      console.error('Failed to fetch pending requests:', err)
    }
  }, [tokens?.idToken])

  // Fetch friend suggestions — API returns a flat array
  const fetchSuggestions = useCallback(async () => {
    if (!tokens?.idToken) return

    try {
      const res = await fetch(`${API}/friendships/suggestions`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : (data.suggestions || [])
        setSuggestions(arr.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    }
  }, [tokens?.idToken])

  // Get friendship status with a specific user
  const getFriendshipStatus = useCallback(async (userId: string): Promise<FriendshipStatus | null> => {
    if (!tokens?.idToken) return null

    try {
      const res = await fetch(`${API}/friendships/status/${userId}`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.error('Failed to fetch friendship status:', err)
    }
    return null
  }, [tokens?.idToken])

  // Send friend request
  const sendRequest = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!tokens?.idToken) return { success: false, error: 'Non authentifié' }

    try {
      const res = await fetch(`${API}/friendships/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        await fetchFriends()
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.message || 'Erreur lors de l\'envoi' }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau' }
    }
  }, [tokens?.idToken, fetchFriends])

  // Accept friend request
  const accept = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!tokens?.idToken) return { success: false, error: 'Non authentifié' }

    try {
      const res = await fetch(`${API}/friendships/accept/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        await Promise.all([fetchFriends(), fetchPendingRequests()])
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.message || 'Erreur lors de l\'acceptation' }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau' }
    }
  }, [tokens?.idToken, fetchFriends, fetchPendingRequests])

  // Cancel a friend request the current user previously sent
  const cancelRequest = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!tokens?.idToken) return { success: false, error: 'Non authentifié' }

    try {
      const res = await fetch(`${API}/friendships/request/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        return { success: true }
      } else {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.message || 'Erreur lors de l\'annulation' }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau' }
    }
  }, [tokens?.idToken])

  // Decline friend request
  const decline = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!tokens?.idToken) return { success: false, error: 'Non authentifié' }

    try {
      const res = await fetch(`${API}/friendships/decline/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        await fetchPendingRequests()
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.message || 'Erreur lors du refus' }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau' }
    }
  }, [tokens?.idToken, fetchPendingRequests])

  // Remove friend
  const removeFriend = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!tokens?.idToken) return { success: false, error: 'Non authentifié' }

    try {
      const res = await fetch(`${API}/friendships/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })

      if (res.ok) {
        await fetchFriends()
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.message || 'Erreur lors de la suppression' }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau' }
    }
  }, [tokens?.idToken, fetchFriends])

  // Initial fetch
  useEffect(() => {
    if (!initialized || !tokens?.idToken) {
      setLoading(false)
      return
    }

    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchSuggestions(),
      ])
      setLoading(false)
    }

    loadAll()
  }, [initialized, tokens?.idToken, fetchFriends, fetchPendingRequests, fetchSuggestions])

  // Polling for online status updates every 30s
  useEffect(() => {
    if (!initialized || !tokens?.idToken) return

    const interval = setInterval(() => {
      fetchFriends()
    }, 30000)

    return () => clearInterval(interval)
  }, [initialized, tokens?.idToken, fetchFriends])

  // Socket.io listeners for friend notifications
  useEffect(() => {
    if (!initialized || !tokens?.idToken) return

    let socket: Socket | null = null

    try {
      socket = io(`${API}/chat`, {
        auth: { token: tokens.idToken },
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => {
        console.log('[Friends] Connected to Socket.io for friend notifications')
      })

      // Listen for friend request
      socket.on('friend_request', (data: { from: { id: string; username: string; avatar?: string } }) => {
        console.log('[Friends] Received friend request from:', data.from.username)
        
        // Show toast notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Nouvelle demande d\'ami', {
            body: `${data.from.username} vous a envoyé une demande d'ami`,
            icon: data.from.avatar || '/logo.png',
          })
        }

        // Refresh pending requests
        fetchPendingRequests()
      })

      // Listen for friend accepted
      socket.on('friend_accepted', (data: { user: { id: string; username: string; avatar?: string } }) => {
        console.log('[Friends] Friend request accepted by:', data.user.username)
        
        // Show toast notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Demande d\'ami acceptée', {
            body: `${data.user.username} a accepté votre demande d'ami`,
            icon: data.user.avatar || '/logo.png',
          })
        }

        // Refresh friends list
        fetchFriends()
      })

      socket.on('disconnect', () => {
        console.log('[Friends] Disconnected from Socket.io')
      })

    } catch (err) {
      console.error('[Friends] Socket.io connection error:', err)
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [initialized, tokens?.idToken, fetchFriends, fetchPendingRequests])

  // Computed values
  const onlineFriends = friends.filter(f => f.status === 'ONLINE')
  const pendingCount = pendingRequests.length

  return {
    friends,
    onlineFriends,
    pendingRequests,
    pendingCount,
    suggestions,
    loading,
    error,
    sendRequest,
    accept,
    decline,
    cancelRequest,
    removeFriend,
    getFriendshipStatus,
    refresh: () => Promise.all([fetchFriends(), fetchPendingRequests(), fetchSuggestions()]),
  }
}
