import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'

let socket: Socket | null = null
let currentToken: string | null = null

export const getSocket = (idToken?: string): Socket | null => {
  if (typeof window === 'undefined') {
    return null
  }

  // Same token + healthy instance → reuse. Check both `connected` and the
  // "currently connecting" state so we don't rebuild the socket during the
  // initial handshake.
  if (socket && currentToken === idToken && (socket.connected || socket.active)) {
    return socket
  }

  if (!idToken) {
    return socket && socket.connected ? socket : null
  }

  // Token rotated or socket is dead — tear the old one down cleanly.
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  currentToken = idToken
  socket = io(`${API_URL}/chat`, {
    auth: {
      token: idToken,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
    // The server forced the disconnect (e.g. cycled the dyno) — socket.io
    // does not auto-reconnect in that case, so we kick it manually.
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
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
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  currentToken = null
}

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false
}
