'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react'
import { VoiceUser } from '@/types/voice'

type VoiceRoomProps = {
  room: string
  users: VoiceUser[]
  isMuted: boolean
  onToggleMute: () => void
  onLeave: () => void
}

export default function VoiceRoom({ room, users, isMuted, onToggleMute, onLeave }: VoiceRoomProps) {
  const roomNames: Record<string, string> = {
    voice_global: 'Global',
    voice_fr: 'Français',
    voice_en: 'English',
  }

  const displayName = roomNames[room] || room.replace('voice_match_', 'Match ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#00165F]/80 dark:bg-[#00165F]/80 rounded-xl border border-[#0097FC]/30 p-4 mt-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-[#0097FC]" />
          <h3 className="font-bold text-white" style={{ fontFamily: 'Dena, sans-serif' }}>
            {displayName}
          </h3>
          <span className="text-xs text-white/60">{users.length} connecté{users.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {users.map((user) => (
          <div key={user.socketId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition">
            <div className="relative">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0097FC] to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              {user.speaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-sm text-white flex-1">{user.username}</span>
            {user.muted && <MicOff className="h-4 w-4 text-red-400" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <button
          onClick={onToggleMute}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span className="text-sm">{isMuted ? 'Muet' : 'Micro'}</span>
        </button>
        <button
          onClick={onLeave}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="text-sm">Quitter</span>
        </button>
      </div>
    </motion.div>
  )
}
