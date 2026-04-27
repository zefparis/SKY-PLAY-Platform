'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { getSocket, disconnectSocket } from '@/lib/socket'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Owns the lifecycle of the shared socket.io connection for the whole app.
 *
 * Responsibilities:
 *  - Initialise the singleton as soon as a token is available so every page
 *    navigation starts with a warm connection.
 *  - Tear the singleton down when the user logs out.
 *  - Keep the Railway dyno warm via a periodic authenticated `/health` ping.
 *
 * Consumers must NEVER call `socket.disconnect()` themselves — only this
 * provider (and `auth-store.logout`) may drop the singleton.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.tokens?.idToken)

  useEffect(() => {
    if (!token) {
      // User is logged out (or was never logged in) — make sure we don't
      // hold a stale socket bound to a rotated/expired token.
      disconnectSocket()
      return
    }

    // Boot the singleton. Subsequent consumers (hooks, pages) will reuse it.
    getSocket(token)

    // Keep-alive ping — slightly under the common 5-minute idle timeout so
    // Railway never has a chance to park the dyno while a user is active.
    const ping = setInterval(() => {
      if (!API_URL) return
      fetch(`${API_URL}/health`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Silent — don't spam the console if the API briefly drops.
      })
    }, 4 * 60 * 1000)

    return () => {
      // Only the interval is torn down on token change; the socket itself is
      // rebuilt inside `getSocket` when the token rotates, and disconnected
      // cleanly in the branch above when the token disappears.
      clearInterval(ping)
    }
  }, [token])

  return <>{children}</>
}

export default SocketProvider
