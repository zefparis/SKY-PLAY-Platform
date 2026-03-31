'use client'

import { useEffect, useState } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type IncomingCall = {
  fromUserId: string
  fromUsername: string
  fromAvatar?: string
  voiceRoom: string
}

type Props = {
  call: IncomingCall | null
  onAccept: (call: IncomingCall) => void
  onDecline: (call: IncomingCall) => void
}

export default function IncomingCallModal({ call, onAccept, onDecline }: Props) {
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    if (!call) { setTimeLeft(30); return }
    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onDecline(call)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [call])

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#00165F] border border-[#0097FC]/40 rounded-2xl shadow-2xl p-5 w-80"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              {call.fromAvatar?.startsWith('http') ? (
                <img src={call.fromAvatar} alt={call.fromUsername} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-2xl">
                  {call.fromUsername[0].toUpperCase()}
                </div>
              )}
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[#0097FC]"
                animate={{ scale: [1, 1.25, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50 mb-0.5">🎤 Appel entrant</p>
              <p className="text-white font-bold text-lg leading-tight truncate">{call.fromUsername}</p>
              <p className="text-xs text-white/40 mt-1">Expire dans {timeLeft}s</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onDecline(call)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition font-semibold text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              Refuser
            </button>
            <button
              onClick={() => onAccept(call)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition font-semibold text-sm"
            >
              <Phone className="w-4 h-4" />
              Accepter
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
