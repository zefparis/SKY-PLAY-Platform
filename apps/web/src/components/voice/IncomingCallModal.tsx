'use client'

import { useEffect, useState } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallRingtone } from '@/hooks/useCallRingtone'

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
  const { startRing, stopRing } = useCallRingtone()

  // Sonnerie entrante
  useEffect(() => {
    if (call) startRing('incoming')
    else stopRing()
    return () => stopRing()
  }, [call?.fromUserId])

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
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="fixed bottom-24 inset-x-3 sm:bottom-auto sm:top-4 sm:left-1/2 sm:inset-x-auto sm:-translate-x-1/2 sm:w-80 z-[9999] bg-[#00165F] border border-[#0097FC]/40 rounded-2xl shadow-2xl p-4"
        >
          {/* Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative shrink-0">
              {call.fromAvatar?.startsWith('http') ? (
                <img src={call.fromAvatar} alt={call.fromUsername} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-xl">
                  {call.fromUsername[0].toUpperCase()}
                </div>
              )}
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[#0097FC]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/50 mb-0.5">🎤 Appel entrant</p>
              <p className="text-white font-bold text-base leading-tight truncate">{call.fromUsername}</p>
              <p className="text-[11px] text-white/40 mt-0.5">Expire dans {timeLeft}s</p>
            </div>
          </div>

          {/* Buttons — big touch targets */}
          <div className="flex gap-3">
            <button
              onClick={() => { stopRing(); onDecline(call) }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 active:bg-red-500/30 hover:bg-red-500/25 transition font-semibold text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              Refuser
            </button>
            <button
              onClick={() => { stopRing(); onAccept(call) }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 active:bg-emerald-500/30 hover:bg-emerald-500/25 transition font-semibold text-sm"
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
