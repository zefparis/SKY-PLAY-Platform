import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'

let socket: Socket | null = null

export const getSocket = (idToken?: string): Socket | null => {
  if (typeof window === 'undefined') {
    return null
  }

  if (socket && socket.connected) {
    return socket
  }

  if (!idToken) {
    return null
  }

  if (socket) {
    socket.disconnect()
  }

  socket = io(`${API_URL}/chat`, {
    auth: {
      token: idToken,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected to chat server')
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message)
  })

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error)
  })

  return socket
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false
}
