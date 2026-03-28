'use client'

import { useEffect, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/lib/auth-store'
import { Message, PrivateMessage, User } from '@/types/chat'

type UseChatReturn = {
  messages: Message[]
  privateMessages: PrivateMessage[]
  connectedUsers: User[]
  currentRoom: string
  isConnected: boolean
  sendMessage: (content: string) => void
  sendPrivate: (toUserId: string, content: string) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
}

export const useChat = (): UseChatReturn => {
  const tokens = useAuthStore((state) => state.tokens)
  const currentUser = useAuthStore((state) => state.user)

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([])
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [currentRoom, setCurrentRoom] = useState<string>('global')

  useEffect(() => {
    if (!tokens?.idToken) {
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
      return
    }

    const newSocket = getSocket(tokens.idToken)

    if (!newSocket) {
      return
    }

    setSocket(newSocket)

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleConnected = (data: { userId: string; username: string; rooms: string[] }) => {
      console.log('[Chat] Connected as', data.username)
      if (data.rooms.includes('global')) {
        setCurrentRoom('global')
      }
    }

    const handleMessage = (message: Message) => {
      setMessages((prev) => [...prev, message])
    }

    const handlePrivateMessage = (message: PrivateMessage) => {
      setPrivateMessages((prev) => [...prev, message])
    }

    const handleUserJoined = (data: { room: string; user: User }) => {
      console.log('[Chat] User joined', data.user.username, 'in', data.room)
    }

    const handleUserLeft = (data: { room: string; user: User }) => {
      console.log('[Chat] User left', data.user.username, 'from', data.room)
    }

    const handleRoomUsers = (data: { room: string; users: User[] }) => {
      if (data.room === currentRoom) {
        setConnectedUsers(data.users)
      }
    }

    const handleError = (error: { message: string }) => {
      console.error('[Chat] Error:', error.message)
    }

    newSocket.on('connect', handleConnect)
    newSocket.on('disconnect', handleDisconnect)
    newSocket.on('connected', handleConnected)
    newSocket.on('message', handleMessage)
    newSocket.on('private_message', handlePrivateMessage)
    newSocket.on('user_joined', handleUserJoined)
    newSocket.on('user_left', handleUserLeft)
    newSocket.on('room_users', handleRoomUsers)
    newSocket.on('error', handleError)

    if (newSocket.connected) {
      setIsConnected(true)
    }

    return () => {
      newSocket.off('connect', handleConnect)
      newSocket.off('disconnect', handleDisconnect)
      newSocket.off('connected', handleConnected)
      newSocket.off('message', handleMessage)
      newSocket.off('private_message', handlePrivateMessage)
      newSocket.off('user_joined', handleUserJoined)
      newSocket.off('user_left', handleUserLeft)
      newSocket.off('room_users', handleRoomUsers)
      newSocket.off('error', handleError)
    }
  }, [tokens?.idToken, currentRoom])

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !isConnected) {
        console.warn('[Chat] Cannot send message: not connected')
        return
      }

      socket.emit('send_message', { room: currentRoom, content })
    },
    [socket, isConnected, currentRoom],
  )

  const sendPrivate = useCallback(
    (toUserId: string, content: string) => {
      if (!socket || !isConnected) {
        console.warn('[Chat] Cannot send private message: not connected')
        return
      }

      socket.emit('send_private', { toUserId, content })
    },
    [socket, isConnected],
  )

  const joinRoom = useCallback(
    (room: string) => {
      if (!socket || !isConnected) {
        console.warn('[Chat] Cannot join room: not connected')
        return
      }

      socket.emit('join_room', { room })
      setCurrentRoom(room)
      setMessages([])
    },
    [socket, isConnected],
  )

  const leaveRoom = useCallback(
    (room: string) => {
      if (!socket || !isConnected) {
        console.warn('[Chat] Cannot leave room: not connected')
        return
      }

      socket.emit('leave_room', { room })
    },
    [socket, isConnected],
  )

  return {
    messages: messages.filter((m) => m.room === currentRoom),
    privateMessages,
    connectedUsers,
    currentRoom,
    isConnected,
    sendMessage,
    sendPrivate,
    joinRoom,
    leaveRoom,
  }
}
