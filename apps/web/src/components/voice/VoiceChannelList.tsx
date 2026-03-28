'use client'

import { Volume2, Users } from 'lucide-react'
import { motion } from 'framer-motion'

type VoiceChannel = {
  id: string
  name: string
  userCount: number
  maxUsers: number
}

type VoiceChannelListProps = {
  channels: VoiceChannel[]
  currentVoiceRoom: string | null
  onJoin: (roomId: string) => void
}

export default function VoiceChannelList({ channels, currentVoiceRoom, onJoin }: VoiceChannelListProps) {
  return (
    <div className="p-4 border-t border-[#00165F]/10 dark:border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="h-4 w-4 text-[#00165F]/60 dark:text-white/60" />
        <span className="text-xs font-semibold text-[#00165F]/60 dark:text-white/60 uppercase tracking-wider">
          Vocal
        </span>
      </div>

      <div className="space-y-1">
        {channels.map((channel) => {
          const isActive = currentVoiceRoom === channel.id
          const isFull = channel.userCount >= channel.maxUsers

          return (
            <button
              key={channel.id}
              onClick={() => !isFull && !isActive && onJoin(channel.id)}
              disabled={isFull || isActive}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                isActive
                  ? 'bg-[#0097FC]/20 text-[#00165F] dark:text-white border-l-3 border-[#0097FC]'
                  : isFull
                  ? 'text-[#00165F]/40 dark:text-white/40 cursor-not-allowed'
                  : 'text-[#00165F]/70 dark:text-white/70 hover:bg-[#00165F]/5 dark:hover:bg-white/5 hover:text-[#0097FC]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span>{channel.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {channel.userCount > 0 && (
                  <motion.div
                    className="flex items-center gap-1 text-xs"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Users className="h-3 w-3" />
                    <span>{channel.userCount}</span>
                  </motion.div>
                )}
                {isFull && (
                  <span className="text-xs text-red-400 ml-2">Plein</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
