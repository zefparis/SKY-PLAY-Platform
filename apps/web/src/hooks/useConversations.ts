'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Socket } from 'socket.io-client'

export interface ConvUser {
  id: string
  username: string
  avatar?: string
  status?: string
}

export interface ConvChallenge {
  id: string
  title: string
  game: string
  status: string
}

export interface ConvMessage {
  id: string
  conversationId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'SYSTEM'
  imageUrl?: string
  author: ConvUser | null
  createdAt: string
}

export interface ConversationMember {
  id: string
  userId: string
  user: ConvUser
  lastReadAt?: string
}

export interface Conversation {
  id: string
  type: 'DM' | 'CHALLENGE'
  name?: string
  challengeId?: string
  challenge?: ConvChallenge
  members: ConversationMember[]
  messages: ConvMessage[]
  unreadCount: number
  updatedAt: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function useConversations(socket: Socket | null) {
  const tokens = useAuthStore((s) => s.tokens)
  const currentUser = useAuthStore((s) => s.user)
  const [dms, setDms] = useState<Conversation[]>([])
  const [challenges, setChallenges] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!tokens?.idToken) return
    try {
      const res = await fetch(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })
      if (!res.ok) return
      const data: Conversation[] = await res.json()
      const challengeConvs = data.filter((c) => c.type === 'CHALLENGE')
      // eslint-disable-next-line no-console
      console.log('[useConversations] challenge convs:', challengeConvs.map((c) => ({
        id: c.id,
        challengeId: c.challengeId,
        status: c.challenge?.status,
        title: c.challenge?.title,
      })))
      setDms(data.filter((c) => c.type === 'DM'))
      setChallenges(challengeConvs)
    } catch (e) {
      console.error('[useConversations]', e)
    } finally {
      setLoading(false)
    }
  }, [tokens?.idToken])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Mise à jour du badge non-lu à chaque nouveau message reçu
  useEffect(() => {
    if (!socket || !currentUser) return
    const handler = (msg: ConvMessage) => {
      if (msg.author?.id === currentUser.id) return
      const bump = (list: Conversation[]) =>
        list.map((c) =>
          c.id === msg.conversationId
            ? { ...c, unreadCount: c.unreadCount + 1, messages: [msg] }
            : c,
        )
      setDms(bump)
      setChallenges(bump)
    }
    socket.on('conversation_message', handler)
    return () => { socket.off('conversation_message', handler) }
  }, [socket, currentUser])

  // Salon défi créé → rafraîchir la liste pour qu'il apparaisse dans la sidebar
  useEffect(() => {
    if (!socket) return
    const handler = () => { fetchConversations() }
    socket.on('challenge_chat_ready', handler)
    return () => { socket.off('challenge_chat_ready', handler) }
  }, [socket, fetchConversations])

  // Salon défi fermé (réconciliation terminée) → le retirer de la sidebar
  useEffect(() => {
    if (!socket) return
    const handler = ({ conversationId }: { conversationId: string }) => {
      setChallenges((prev) => prev.filter((c) => c.id !== conversationId))
    }
    socket.on('challenge_chat_closed', handler)
    return () => { socket.off('challenge_chat_closed', handler) }
  }, [socket])

  // Ouvrir ou créer un DM
  const openDm = useCallback(
    async (userId: string): Promise<Conversation | null> => {
      if (!tokens?.idToken) return null
      try {
        const res = await fetch(`${API}/chat/conversations/dm/${userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        })
        if (!res.ok) return null
        const conv: Conversation = await res.json()
        setDms((prev) => {
          const exists = prev.find((c) => c.id === conv.id)
          return exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev]
        })
        return conv
      } catch {
        return null
      }
    },
    [tokens?.idToken],
  )

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!tokens?.idToken) return
      await fetch(`${API}/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      }).catch(() => {})
      const clear = (list: Conversation[]) =>
        list.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      setDms(clear)
      setChallenges(clear)
    },
    [tokens?.idToken],
  )

  return { dms, challenges, loading, openDm, markAsRead, refresh: fetchConversations }
}
