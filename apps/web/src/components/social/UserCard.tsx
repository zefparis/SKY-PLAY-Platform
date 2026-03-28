'use client'

import { User, UserPlus, UserCheck, Ban } from 'lucide-react'

type UserCardProps = {
  user: {
    id: string
    username: string
    avatar?: string
    level?: number
    status?: string
  }
  friendshipStatus?: string
  onAddFriend?: () => void
  onRemoveFriend?: () => void
  onBlock?: () => void
  showActions?: boolean
}

export default function UserCard({
  user,
  friendshipStatus = 'NONE',
  onAddFriend,
  onRemoveFriend,
  onBlock,
  showActions = true,
}: UserCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-400'
      case 'IN_GAME':
        return 'bg-orange-400'
      case 'AWAY':
        return 'bg-yellow-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition">
      <div className="relative">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        )}
        {user.status && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0f1e] ${getStatusColor(user.status)}`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
        {user.level !== undefined && (
          <p className="text-xs text-white/60">Niveau {user.level}</p>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          {friendshipStatus === 'NONE' && onAddFriend && (
            <button
              onClick={onAddFriend}
              className="p-2 rounded-lg bg-sky-400/20 text-sky-400 hover:bg-sky-400/30 transition"
              title="Ajouter en ami"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
          {friendshipStatus === 'ACCEPTED' && onRemoveFriend && (
            <button
              onClick={onRemoveFriend}
              className="p-2 rounded-lg bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 transition"
              title="Ami"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          {onBlock && (
            <button
              onClick={onBlock}
              className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition"
              title="Bloquer"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
