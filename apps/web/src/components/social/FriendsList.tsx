'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, MessageCircle, Swords, Check, X, UserPlus, Search, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useFriendships } from '@/hooks/useFriendships'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://skyplayapi-production.up.railway.app'

type SearchUser = {
  id: string
  username: string
  avatar?: string
  level?: number
}

export default function FriendsList() {
  const tokens = useAuthStore((state) => state.tokens)
  const initialized = useAuthStore((state) => state.initialized)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const router = useRouter()

  const {
    friends,
    onlineFriends,
    pendingRequests,
    pendingCount,
    suggestions,
    loading,
    accept,
    decline,
    sendRequest,
  } = useFriendships()

  useEffect(() => { setMounted(true) }, [])

  const handleSearch = useCallback(async (q: string) => {
    if (!tokens?.idToken || q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await fetch(`${API}/chat/users/search?q=${encodeURIComponent(q.trim())}`, {
        headers: { Authorization: `Bearer ${tokens.idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [tokens?.idToken])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  if (!mounted || !initialized || !tokens) return null

  const handleAccept = async (userId: string) => {
    setActionLoading(userId)
    await accept(userId)
    setActionLoading(null)
  }

  const handleDecline = async (userId: string) => {
    setActionLoading(userId)
    await decline(userId)
    setActionLoading(null)
  }

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId)
    await sendRequest(userId)
    setActionLoading(null)
  }

  const handleOpenDM = (userId: string, username: string) => {
    setIsOpen(false)
    router.push(`/chat?dm=${userId}`)
  }

  const openSearch = () => {
    setShowSearch(true)
    setSearchQuery('')
    setSearchResults([])
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAddFromSearch = async (userId: string) => {
    setActionLoading(userId)
    await sendRequest(userId)
    setSentRequests(prev => new Set(prev).add(userId))
    setActionLoading(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-emerald-500'
      case 'AWAY': return 'bg-yellow-500'
      case 'IN_GAME': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'En ligne'
      case 'AWAY': return 'Absent'
      case 'IN_GAME': return 'En jeu'
      default: return 'Hors ligne'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition"
      >
        <Users className="h-5 w-5 text-white/70" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FD2E5F] text-white text-xs font-bold flex items-center justify-center animate-pulse">
            {pendingCount}
          </span>
        )}
        {pendingCount === 0 && onlineFriends.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
            {onlineFriends.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-w-[calc(100vw-1rem)] rounded-xl bg-[#0a0f1e] border border-white/10 shadow-2xl max-h-[80vh] sm:max-h-[600px] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0f1e] p-4 border-b border-white/10 z-10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Amis ({friends.length})
              </h3>
              <p className="text-xs text-white/60 mt-1">
                {onlineFriends.length} en ligne
              </p>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2">
                  Demandes en attente ({pendingRequests.length})
                </h4>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 rounded-lg bg-[#FD2E5F]/10 border border-[#FD2E5F]/30 flex items-center gap-3"
                    >
                      {request.sender.avatar ? (
                        <img
                          src={request.sender.avatar}
                          alt={request.sender.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold">
                          {request.sender.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {request.sender.username}
                        </p>
                        <p className="text-xs text-white/50">
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAccept(request.senderId)}
                          disabled={actionLoading === request.senderId}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition disabled:opacity-50"
                          title="Accepter"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDecline(request.senderId)}
                          disabled={actionLoading === request.senderId}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50"
                          title="Refuser"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online Friends */}
            {onlineFriends.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">
                  En ligne ({onlineFriends.length})
                </h4>
                <div className="space-y-1">
                  {onlineFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-2 rounded-lg hover:bg-white/5 transition flex items-center gap-3"
                    >
                      <div className="relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-sm">
                            {friend.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0f1e] animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {friend.username}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenDM(friend.id, friend.username)}
                          className="p-1.5 rounded-lg bg-[#0097FC]/20 hover:bg-[#0097FC]/30 text-[#0097FC] transition"
                          title="Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href="/challenges"
                          onClick={() => setIsOpen(false)}
                          className="p-1.5 rounded-lg bg-[#FD2E5F]/20 hover:bg-[#FD2E5F]/30 text-[#FD2E5F] transition"
                          title="Défier"
                        >
                          <Swords className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Friends */}
            {friends.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2">
                  Tous les amis
                </h4>
                <div className="space-y-1">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-2 rounded-lg hover:bg-white/5 transition flex items-center gap-3"
                    >
                      <div className="relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-sm">
                            {friend.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(friend.status)} border-2 border-[#0a0f1e]`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {friend.username}
                        </p>
                        <p className="text-xs text-white/50">
                          {getStatusLabel(friend.status)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenDM(friend.id, friend.username)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0097FC]/20 text-white/60 hover:text-[#0097FC] transition"
                          title="Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2">
                  Suggestions
                </h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/8 transition flex items-center gap-3"
                    >
                      {suggestion.avatar ? (
                        <img
                          src={suggestion.avatar}
                          alt={suggestion.username}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-sm">
                          {suggestion.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {suggestion.username}
                        </p>
                        <p className="text-xs text-white/50">
                          {suggestion.commonChallenges} {suggestion.commonChallenges > 1 ? 'parties' : 'partie'} en commun
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendRequest(suggestion.id)}
                        disabled={actionLoading === suggestion.id}
                        className="p-1.5 rounded-lg bg-[#0097FC]/20 hover:bg-[#0097FC]/30 text-[#0097FC] transition disabled:opacity-50"
                        title="Ajouter"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Panel */}
            {showSearch && (
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={closeSearch}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wide">
                    Rechercher un joueur
                  </h4>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom d'utilisateur..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0097FC]/50"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
                  )}
                </div>
                {searchQuery.trim().length >= 2 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.length === 0 && !searchLoading && (
                      <p className="text-xs text-white/40 text-center py-3">Aucun résultat</p>
                    )}
                    {searchResults.map((user) => {
                      const alreadyFriend = friends.some(f => f.id === user.id)
                      const alreadySent = sentRequests.has(user.id)
                      return (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-xs">
                              {user.username[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                            {user.level && <p className="text-xs text-white/40">Niveau {user.level}</p>}
                          </div>
                          {alreadyFriend ? (
                            <span className="text-xs text-emerald-400 font-semibold">Ami ✓</span>
                          ) : alreadySent ? (
                            <span className="text-xs text-white/40">Envoyé ✓</span>
                          ) : (
                            <button
                              onClick={() => handleAddFromSearch(user.id)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded-lg bg-[#0097FC]/20 hover:bg-[#0097FC]/30 text-[#0097FC] transition disabled:opacity-50"
                              title="Ajouter"
                            >
                              {actionLoading === user.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <UserPlus className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!showSearch && friends.length === 0 && pendingRequests.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/50 mb-4">
                  Aucun ami pour le moment
                </p>
                <button
                  onClick={openSearch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0097FC] hover:bg-[#0097FC]/90 text-white text-sm font-semibold transition"
                >
                  <Search className="w-4 h-4" />
                  Trouver des joueurs
                </button>
              </div>
            )}

            {/* Footer */}
            {!showSearch && friends.length > 0 && (
              <div className="p-3">
                <button
                  onClick={openSearch}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-white/5 hover:bg-[#0097FC]/20 text-white/70 hover:text-[#0097FC] text-sm font-semibold transition"
                >
                  <Search className="w-4 h-4" />
                  Trouver des joueurs
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
