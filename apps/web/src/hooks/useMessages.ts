'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Socket } from 'socket.io-client'
import { ConvMessage } from './useConversations'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function useMessages(conversationId: string | null, socket: Socket | null) {
  const tokens = useAuthStore((s) => s.tokens)
  const [messages, setMessages] = useState<ConvMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const oldestId = useRef<string | null>(null)
  const prevConvId = useRef<string | null>(null)

  const fetchMessages = useCallback(
    async (cid: string) => {
      if (!tokens?.idToken) return
      setLoading(true)
      try {
        const res = await fetch(`${API}/chat/conversations/${cid}/messages?limit=50`, {
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        })
        if (!res.ok) return
        const data: ConvMessage[] = await res.json()
        setMessages(data)
        setHasMore(data.length === 50)
        oldestId.current = data[0]?.id ?? null
      } catch (e) {
        console.error('[useMessages]', e)
      } finally {
        setLoading(false)
      }
    },
    [tokens?.idToken],
  )

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setHasMore(false)
      return
    }
    if (conversationId !== prevConvId.current) {
      // Leave old room
      if (prevConvId.current) socket?.emit('leave_conversation', { conversationId: prevConvId.current })
      prevConvId.current = conversationId
      fetchMessages(conversationId)
      socket?.emit('join_conversation', { conversationId })
    }
  }, [conversationId, socket, fetchMessages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevConvId.current) socket?.emit('leave_conversation', { conversationId: prevConvId.current })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for new messages on the active conversation
  useEffect(() => {
    if (!socket || !conversationId) return
    const handler = (msg: ConvMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }
    socket.on('conversation_message', handler)
    return () => { socket.off('conversation_message', handler) }
  }, [socket, conversationId])

  // Listen for deleted messages
  useEffect(() => {
    if (!socket) return
    const handler = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
    socket.on('message_deleted', handler)
    return () => { socket.off('message_deleted', handler) }
  }, [socket])

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !conversationId || !content.trim()) return
      socket.emit('send_conversation_message', { conversationId, content: content.trim(), type: 'TEXT' })
    },
    [socket, conversationId],
  )

  const sendImage = useCallback(
    (imageUrl: string, caption = '') => {
      if (!socket || !conversationId) return
      socket.emit('send_conversation_message', {
        conversationId,
        content: caption,
        type: 'IMAGE',
        imageUrl,
      })
    },
    [socket, conversationId],
  )

  const loadMore = useCallback(async () => {
    if (!tokens?.idToken || !conversationId || !oldestId.current) return
    const res = await fetch(
      `${API}/chat/conversations/${conversationId}/messages?cursor=${oldestId.current}&limit=50`,
      { headers: { Authorization: `Bearer ${tokens.idToken}` } },
    )
    if (!res.ok) return
    const data: ConvMessage[] = await res.json()
    setMessages((prev) => [...data, ...prev])
    setHasMore(data.length === 50)
    if (data.length > 0) oldestId.current = data[0].id
  }, [tokens?.idToken, conversationId])

  return { messages, loading, hasMore, sendMessage, sendImage, loadMore }
}
