'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const tokens = useAuthStore((state) => state.tokens)
  const initialized = useAuthStore((state) => state.initialized)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!initialized || !tokens?.idToken) return

    const fetchNotifications = async () => {
      // Double-check token avant la requête
      if (!tokens?.idToken) return

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/notifications?limit=10`,
          {
            headers: {
              Authorization: `Bearer ${tokens.idToken}`,
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        } else if (response.status === 401) {
          // Token invalide ou expiré - ne pas logger d'erreur
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        // Ignorer les erreurs réseau silencieusement
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [tokens?.idToken, initialized])

  const markAsRead = async (id: string) => {
    if (!tokens?.idToken) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://skyplayapi-production.up.railway.app'}/notifications/${id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.idToken}`,
          },
        },
      )

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  if (!mounted || !initialized || !tokens) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition"
      >
        <Bell className="h-5 w-5 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-16 rounded-t-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-12 md:w-80 md:rounded-xl z-[10000] bg-[#00165F] border-t md:border border-white/10 shadow-xl max-h-[calc(85vh-4rem)] md:max-h-96 overflow-y-auto">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition text-lg leading-none">&times;</button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/50 text-sm">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id)
                      setIsOpen(false)
                    }}
                    className={`w-full p-4 text-left hover:bg-white/5 transition ${
                      !notif.read ? 'bg-sky-400/10' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {notif.title}
                    </p>
                    <p className="text-xs text-white/60 mt-1">{notif.body}</p>
                    <p className="text-xs text-white/40 mt-2">
                      {new Date(notif.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
