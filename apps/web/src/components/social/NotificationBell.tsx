'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  UserPlus,
  Swords,
  Gamepad2,
  Camera,
  AlertTriangle,
  Trophy,
  Medal,
  Info,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { io, Socket } from 'socket.io-client'

type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'CHALLENGE_INVITE'
  | 'CHALLENGE_START'
  | 'CHALLENGE_STARTED'
  | 'RESULT_SUBMITTED'
  | 'MATCH_RESULT'
  | 'DISPUTE_OPENED'
  | 'CHALLENGE_DISPUTED'
  | 'LEAGUE_PROMOTION'
  | 'MATCH_WALKOVER'
  | 'CHALLENGE_WON'
  | 'CHALLENGE_LOST'
  | 'SYSTEM'
  | string

type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  readAt?: string | null
  data?: Record<string, any> | null
  createdAt: string
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'

/* ----------------------------- Type → presentation ----------------------------- */

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return <UserPlus className="w-4 h-4" />
    case 'CHALLENGE_INVITE':
      return <Swords className="w-4 h-4" />
    case 'CHALLENGE_START':
    case 'CHALLENGE_STARTED':
      return <Gamepad2 className="w-4 h-4" />
    case 'RESULT_SUBMITTED':
    case 'MATCH_RESULT':
      return <Camera className="w-4 h-4" />
    case 'DISPUTE_OPENED':
    case 'CHALLENGE_DISPUTED':
      return <AlertTriangle className="w-4 h-4" />
    case 'LEAGUE_PROMOTION':
    case 'CHALLENGE_WON':
      return <Trophy className="w-4 h-4" />
    case 'MATCH_WALKOVER':
      return <Medal className="w-4 h-4" />
    default:
      return <Info className="w-4 h-4" />
  }
}

function getNotificationAccent(type: NotificationType): string {
  switch (type) {
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return 'text-[#FD2E5F] bg-[#FD2E5F]/10'
    case 'CHALLENGE_INVITE':
    case 'CHALLENGE_START':
    case 'CHALLENGE_STARTED':
      return 'text-[#0097FC] bg-[#0097FC]/10'
    case 'DISPUTE_OPENED':
    case 'CHALLENGE_DISPUTED':
      return 'text-amber-400 bg-amber-400/10'
    case 'LEAGUE_PROMOTION':
    case 'CHALLENGE_WON':
    case 'MATCH_WALKOVER':
      return 'text-emerald-400 bg-emerald-400/10'
    default:
      return 'text-white/70 bg-white/5'
  }
}

/* ----------------------------- Component ----------------------------- */

export default function NotificationBell() {
  const tokens = useAuthStore((state) => state.tokens)
  const initialized = useAuthStore((state) => state.initialized)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => { setMounted(true) }, [])

  /* ---------- Initial load ---------- */
  const fetchAll = useCallback(async () => {
    if (!tokens?.idToken) return
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(`${API_URL}/notifications?limit=20`, {
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        }),
        fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        }),
      ])

      if (listRes.ok) {
        const data = await listRes.json()
        setNotifications(data.notifications || [])
      } else if (listRes.status === 401) {
        setNotifications([])
      }

      if (countRes.ok) {
        const data = await countRes.json()
        setCount(typeof data.count === 'number' ? data.count : 0)
      } else if (countRes.status === 401) {
        setCount(0)
      }
    } catch {
      /* silent */
    }
  }, [tokens?.idToken])

  useEffect(() => {
    if (!initialized || !tokens?.idToken) return
    fetchAll()
    // Lightweight fallback poll every 60s, in case socket drops
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [initialized, tokens?.idToken, fetchAll])

  /* ---------- Socket realtime ---------- */
  useEffect(() => {
    if (!tokens?.idToken || !initialized) return

    const sock = io(`${API_URL}/chat`, {
      auth: { token: tokens.idToken },
      transports: ['websocket'],
      reconnection: true,
    })
    socketRef.current = sock

    sock.on('new_notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50))
      setCount((prev) => prev + 1)
    })

    sock.on('notification_count', (data: { count: number }) => {
      setCount(Math.max(0, data?.count ?? 0))
    })

    return () => {
      sock.disconnect()
      socketRef.current = null
    }
  }, [tokens?.idToken, initialized])

  /* ---------- Open / close ---------- */
  const handleOpen = useCallback(async () => {
    setIsOpen(true)
    if (count === 0 || !tokens?.idToken) return

    // Optimistic UI
    setCount(0)
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true })),
    )

    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })
    } catch {
      /* silent — UI already updated */
    }
  }, [count, tokens?.idToken])

  /* ---------- Single mark-as-read ---------- */
  const markOneAsRead = useCallback(
    async (id: string) => {
      if (!tokens?.idToken) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      setCount((prev) => Math.max(0, prev - 1))
      try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        })
      } catch {
        /* silent */
      }
    },
    [tokens?.idToken],
  )

  /* ---------- Friend request inline actions ---------- */
  const respondToFriendRequest = useCallback(
    async (notif: Notification, accept: boolean) => {
      const senderId = notif.data?.senderId
      if (!tokens?.idToken || !senderId) return
      setActionLoading(notif.id)
      try {
        await fetch(
          `${API_URL}/friendships/${accept ? 'accept' : 'decline'}/${senderId}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokens.idToken}` },
          },
        )
        // Mark this notif as read locally
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        )
        setCount((prev) => Math.max(0, prev - 1))
        // Persist read on backend
        fetch(`${API_URL}/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        }).catch(() => {})
      } finally {
        setActionLoading(null)
      }
    },
    [tokens?.idToken],
  )

  if (!mounted || !initialized || !tokens) return null

  const badgeLabel = count > 99 ? '99+' : String(count)

  return (
    <div className="relative">
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="relative p-2 rounded-lg hover:bg-white/5 transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white/70" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-16 rounded-t-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-12 md:w-96 md:rounded-xl z-[10000] bg-[#00165F] border-t md:border border-white/10 shadow-xl max-h-[calc(85vh-4rem)] md:max-h-[28rem] overflow-y-auto">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#00165F] z-10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition text-lg leading-none"
                aria-label="Fermer"
              >
                &times;
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/50 text-sm">
                Aucune notification
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {notifications.map((notif) => {
                  const accent = getNotificationAccent(notif.type)
                  const isFriendReq = notif.type === 'FRIEND_REQUEST'
                  return (
                    <li
                      key={notif.id}
                      className={`p-3 transition ${
                        !notif.read ? 'bg-sky-400/5' : ''
                      } hover:bg-white/5`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}
                        >
                          {getNotificationIcon(notif.type)}
                        </div>
                        <button
                          onClick={() => !notif.read && markOneAsRead(notif.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-semibold text-white truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="text-[11px] text-white/40 mt-1">
                            {new Date(notif.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </button>
                        {!notif.read && (
                          <span
                            className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[#0097FC]"
                            aria-label="Non lu"
                          />
                        )}
                      </div>

                      {/* Inline actions for FRIEND_REQUEST */}
                      {isFriendReq && notif.data?.senderId && (
                        <div className="mt-2 flex gap-2 pl-12">
                          <button
                            disabled={actionLoading === notif.id}
                            onClick={() => respondToFriendRequest(notif, true)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold transition disabled:opacity-50"
                          >
                            Accepter
                          </button>
                          <button
                            disabled={actionLoading === notif.id}
                            onClick={() => respondToFriendRequest(notif, false)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
