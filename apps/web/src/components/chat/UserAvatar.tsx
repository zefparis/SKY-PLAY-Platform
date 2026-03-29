'use client'

import { DiscordBadge } from './DiscordBadge'

interface UserAvatarProps {
  name: string
  avatar?: string | null
  discordId?: string | null
  discordTag?: string | null
  size?: number
  showBadge?: boolean
}

export function UserAvatar({ name, avatar, discordId, discordTag, size = 8, showBadge = false }: UserAvatarProps) {
  const sizeClass = `w-${size} h-${size}`
  
  // Si discordId présent et pas d'avatar custom, utiliser avatar Discord
  const displayAvatar = avatar || (discordId ? `https://cdn.discordapp.com/avatars/${discordId}/${discordId}.png` : null)
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative shrink-0">
        {displayAvatar ? (
          <img 
            src={displayAvatar} 
            alt={name} 
            className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10`}
            onError={(e) => {
              // Fallback si l'avatar Discord échoue
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0097FC&color=fff`
            }}
          />
        ) : (
          <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center ring-2 ring-white/10`}>
            <span className="text-white font-bold text-xs">{name[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      {showBadge && discordTag && <DiscordBadge discordTag={discordTag} />}
    </div>
  )
}
