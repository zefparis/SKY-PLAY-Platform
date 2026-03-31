'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff, ChevronDown, ChevronUp } from 'lucide-react'
import { VoiceUser } from '@/types/voice'

type Props = {
  room: string
  users: VoiceUser[]
  isMuted: boolean
  onToggleMute: () => void
  onLeave: () => void
}

export default function PersistentVoicePanel({ room, users, isMuted, onToggleMute, onLeave }: Props) {
  const [expanded, setExpanded] = useState(false)

  const roomLabels: Record<string, string> = {
    voice_global: '🌍 Global',
    voice_fr: '🇫🇷 Français',
    voice_en: '🇬🇧 English',
  }

  const displayName = room.startsWith('voice_challenge_')
    ? '🎮 Salon Défi'
    : room.startsWith('voice_dm_')
    ? '📞 Appel privé'
    : roomLabels[room] ?? room

  return (
    <div className="shrink-0 border-t border-emerald-500/20 bg-[#001040]/80 backdrop-blur-sm">
      {/* ── Barre principale toujours visible ── */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="text-[11px] font-bold text-white truncate">{displayName}</span>
            {users.length > 0 && (
              <span className="text-[10px] text-white/40 shrink-0">{users.length} connecté{users.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <p className="text-[9px] text-emerald-400/70 pl-4">En vocal</p>
        </div>

        {/* Expand / collapse participants */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/50 hover:text-white shrink-0"
          title={expanded ? 'Réduire' : 'Voir participants'}
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {/* Mute */}
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg transition shrink-0 ${
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
          title={isMuted ? 'Activer micro' : 'Couper micro'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition shrink-0"
          title="Quitter le vocal"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Liste participants ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1 max-h-36 overflow-y-auto">
              {users.map((user) => (
                <div key={user.socketId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                  <div className="relative shrink-0">
                    {user.avatar?.startsWith('http') ? (
                      <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0097FC] to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    {user.speaking && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-emerald-400"
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-white flex-1 truncate">{user.username}</span>
                  {user.muted && <MicOff className="w-3 h-3 text-red-400 shrink-0" />}
                  {user.speaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
