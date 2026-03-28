'use client'

import { motion } from 'framer-motion'
import { Volume2, Mic, MicOff, PhoneOff } from 'lucide-react'

type VoiceIndicatorProps = {
  roomName: string
  isMuted: boolean
  onToggleMute: () => void
  onLeave: () => void
}

export default function VoiceIndicator({ roomName, isMuted, onToggleMute, onLeave }: VoiceIndicatorProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 h-12 bg-[#00165F] border-t border-[#0097FC]/30 flex items-center justify-between px-4 z-50"
    >
      <div className="flex items-center gap-3">
        <Volume2 className="h-5 w-5 text-[#0097FC]" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Dena, sans-serif' }}>
            Vocal
          </span>
          <span className="text-xs text-white/60">• {roomName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-lg transition ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          aria-label={isMuted ? 'Activer le micro' : 'Couper le micro'}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          onClick={onLeave}
          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
          aria-label="Quitter le vocal"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
