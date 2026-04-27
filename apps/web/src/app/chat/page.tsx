'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Send, Smile, Zap, Plus, Search, X, ArrowLeft, Paperclip, Swords, ChevronRight, Trash2, Phone, PhoneOff, Volume2, Bell, BellOff, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useChat } from '@/hooks/useChat'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useConversations, Conversation, ConvMessage } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import { useFriendships } from '@/hooks/useFriendships'
import { useSoundNotification } from '@/hooks/useSoundNotification'
import EmojiPicker from '@/components/chat/EmojiPicker'
import StreamPlayer from '@/components/tournaments/StreamPlayer'
import VoiceChannelList from '@/components/voice/VoiceChannelList'
import VoiceRoom from '@/components/voice/VoiceRoom'
import IncomingCallModal from '@/components/voice/IncomingCallModal'
import PersistentVoicePanel from '@/components/voice/PersistentVoicePanel'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const ROOMS = [
  { id: 'global', label: '🌍 Global' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveConv =
  | { type: 'GLOBAL'; room: string }
  | { type: 'DM' | 'CHALLENGE'; conversationId: string; conv: Conversation }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 7 }: { name: string; src?: string; size?: number }) {
  const s = `w-${size} h-${size}`
  return src?.startsWith('http') ? (
    <img src={src} alt={name} className={`${s} rounded-full object-cover ring-2 ring-white/10`} />
  ) : (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-xs shrink-0`}>
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

function RelTime({ date }: { date: string | Date }) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return <span>à l&apos;instant</span>
  if (diff < 3600000) return <span>il y a {Math.floor(diff / 60000)} min</span>
  return <span>{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter()
  const { t } = useI18n()
  const tokens = useAuthStore((s) => s.tokens)
  const currentUser = useAuthStore((s) => s.user)

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeConv, setActiveConv] = useState<ActiveConv>({ type: 'GLOBAL', room: 'global' })

  // New DM modal
  const [showNewDm, setShowNewDm] = useState(false)
  const [dmSearch, setDmSearch] = useState('')
  const [dmResults, setDmResults] = useState<{ id: string; username: string; avatar?: string }[]>([])
  const [dmSearching, setDmSearching] = useState(false)
  
  // Friends for DM
  const { friends: friendsList } = useFriendships()

  // Submit result modal
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitRank, setSubmitRank] = useState(1)
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitAnalyzing, setSubmitAnalyzing] = useState(false)

  // Voice
  const [showVoice, setShowVoice] = useState(false)

  // Input
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitFileInputRef = useRef<HTMLInputElement>(null)

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { messages: globalMsgs, connectedUsers, currentRoom, isConnected, socket, sendMessage: sendGlobal, joinRoom } = useChat()
  const { isInVoice, currentVoiceRoom, voiceUsers, isMuted, error: voiceError, incomingCall, callingUser, voiceChannelCounts, joinVoiceRoom, leaveVoiceRoom, toggleMute, callUser, acceptCall, declineCall, cancelCall } = useVoiceChat({ socket, isConnected })
  const { dms, challenges, openDm, markAsRead } = useConversations(socket)
  const convId = activeConv.type !== 'GLOBAL' ? activeConv.conversationId : null
  const { messages: convMsgs, sendMessage: sendConv, sendImage } = useMessages(convId, socket)
  const { playSound, soundEnabled, toggleSound } = useSoundNotification()

  // ── DEEP-LINK: open a specific conversation from /chat?conv=<id> ─────────────
  const searchParams = useSearchParams()
  const deepLinkConv = searchParams?.get('conv') ?? null
  const [deepLinkConsumed, setDeepLinkConsumed] = useState(false)
  useEffect(() => {
    if (!deepLinkConv || deepLinkConsumed) return
    const all = [...dms, ...challenges]
    const target = all.find((c) => c.id === deepLinkConv)
    if (!target) return
    setActiveConv({ type: target.type, conversationId: target.id, conv: target })
    setDeepLinkConsumed(true)
  }, [deepLinkConv, deepLinkConsumed, dms, challenges])

  // ── STREAM BANNER (per-conversation: { streamUrl, streamType, playerName }) ─────
  type StreamInfo = { streamUrl: string; streamType: 'YOUTUBE' | 'TWITCH' | 'FACEBOOK'; playerName?: string }
  const [streamByConv, setStreamByConv] = useState<Record<string, StreamInfo>>({})
  const [streamHidden, setStreamHidden] = useState<Record<string, boolean>>({})

  // ── STREAM: listen for live stream announcements on the chat socket ───────────
  useEffect(() => {
    if (!socket) return
    const handler = (data: { conversationId?: string; streamUrl: string; streamType: string; playerName?: string }) => {
      if (!data?.conversationId || !data.streamUrl) return
      setStreamByConv((prev) => ({
        ...prev,
        [data.conversationId!]: {
          streamUrl: data.streamUrl,
          streamType: (data.streamType as StreamInfo['streamType']) ?? 'YOUTUBE',
          playerName: data.playerName,
        },
      }))
      setStreamHidden((prev) => ({ ...prev, [data.conversationId!]: false }))
    }
    socket.on('stream_started', handler)
    return () => { socket.off('stream_started', handler) }
  }, [socket])

  // ── STREAM: fetch existing stream when opening a CHALLENGE conv ───────────────
  useEffect(() => {
    if (activeConv.type !== 'CHALLENGE') return
    const challengeId = activeConv.conv.challengeId
    const conversationId = activeConv.conversationId
    if (!challengeId || streamByConv[conversationId]) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/challenges/${challengeId}`)
        if (!res.ok) return
        const data = await res.json()
        const match = (data?.matches ?? []).find((m: any) => m.streamUrl)
        if (cancelled || !match) return
        setStreamByConv((prev) => ({
          ...prev,
          [conversationId]: {
            streamUrl: match.streamUrl,
            streamType: match.streamType ?? 'YOUTUBE',
            playerName: match.player1?.username ?? match.player2?.username,
          },
        }))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [activeConv, streamByConv])

  // ── SOUND: play "pop" on incoming foreign message not in the active conv ────
  useEffect(() => {
    if (!socket || !currentUser) return
    const handler = (msg: any) => {
      const authorId = msg?.author?.id ?? msg?.authorId
      if (!authorId || authorId === currentUser.id) return
      // Skip if user is currently focused on this exact conversation
      const isViewingThisConv =
        activeConv.type !== 'GLOBAL' &&
        activeConv.conversationId === msg.conversationId &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        document.hasFocus()
      if (isViewingThisConv) return
      playSound('message')
    }
    socket.on('conversation_message', handler)
    return () => { socket.off('conversation_message', handler) }
  }, [socket, currentUser, activeConv, playSound])

  const [deletingMsg, setDeletingMsg] = useState<string | null>(null)

  // Auth redirect
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted && !tokens) router.push('/') }, [mounted, tokens, router])

  // Active messages (global or conversation)
  const activeMessages = activeConv.type === 'GLOBAL' ? globalMsgs : convMsgs

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeMessages])

  // Mark as read when switching conversation
  useEffect(() => {
    if (activeConv.type !== 'GLOBAL') markAsRead(activeConv.conversationId)
  }, [activeConv, markAsRead])

  // Listen for message deletion confirmation
  useEffect(() => {
    if (!socket) return
    const handleDeleted = ({ messageId }: { messageId: string }) => {
      if (deletingMsg === messageId) {
        setDeletingMsg(null)
      }
    }
    socket.on('message_deleted', handleDeleted)
    return () => { socket.off('message_deleted', handleDeleted) }
  }, [socket, deletingMsg])

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim()) return
    if (activeConv.type === 'GLOBAL') {
      if (!isConnected) return
      sendGlobal(input.trim())
    } else {
      sendConv(input.trim())
    }
    setInput('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }, [input, activeConv, isConnected, sendGlobal, sendConv])

  // ── Screenshot upload ──────────────────────────────────────────────────────
  const handleScreenshot = useCallback(async (file: File) => {
    if (!tokens?.idToken) {
      setUploadError('Non authentifié')
      return
    }

    // Validation côté client
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 5MB)')
      setTimeout(() => setUploadError(null), 4000)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Type de fichier non supporté (${file.type})`)
      setTimeout(() => setUploadError(null), 4000)
      return
    }

    setUploadingImage(true)
    setUploadError(null)
    
    try {
      const form = new FormData()
      form.append('file', file)
      
      console.log('[Upload] Sending file:', file.name, file.type, file.size)
      
      const res = await fetch(`${API}/chat/upload-screenshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
        body: form,
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[Upload] Error response:', res.status, errorText)
        setUploadError(`Erreur ${res.status}: ${errorText.substring(0, 50)}`)
        return
      }
      
      const { url } = await res.json()
      console.log('[Upload] Success:', url)
      sendImage(url)
    } catch (error) {
      console.error('[Upload] Exception:', error)
      setUploadError('Impossible d\'envoyer l\'image')
    } finally {
      setUploadingImage(false)
      setTimeout(() => setUploadError(null), 4000)
    }
  }, [tokens?.idToken, sendImage])

  // ── Delete message ─────────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!socket || deletingMsg) return
    setDeletingMsg(messageId)
    // Émettre l'événement de suppression via socket
    socket.emit('message_deleted', { messageId })
    // Le socket répondra avec l'événement de confirmation ou d'erreur
    setTimeout(() => setDeletingMsg(null), 2000) // Reset après 2s au cas où
  }, [socket, deletingMsg])

  // ── DM user search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dmSearch.trim() || !tokens?.idToken) { setDmResults([]); return }
    setDmSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/chat/users/search?q=${encodeURIComponent(dmSearch)}`, {
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        })
        if (res.ok) setDmResults(await res.json())
      } finally { setDmSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [dmSearch, tokens?.idToken])

  // ── Submit result ─────────────────────────────────────────────────────────
  const handleSubmitResult = useCallback(async () => {
    if (!submitFile || !tokens?.idToken || activeConv.type !== 'CHALLENGE') return
    setSubmitLoading(true)
    try {
      const form = new FormData()
      form.append('file', submitFile)
      const uploadRes = await fetch(`${API}/chat/upload-screenshot`, {
        method: 'POST', headers: { Authorization: `Bearer ${tokens.idToken}` }, body: form,
      })
      if (!uploadRes.ok) return
      const { url } = await uploadRes.json()

      const challengeId = activeConv.conv?.challengeId
      if (!challengeId) return

      await fetch(`${API}/challenges/${challengeId}/submit-result`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: submitRank, screenshotUrl: url }),
      })
      sendConv(`📸 J'ai soumis mon résultat : place #${submitRank}`)
      // Show "analyzing" state immediately (don't wait for socket) for instant UX feedback
      setSubmitAnalyzing(true)
      setSubmitFile(null)
      // Auto-close modal after 3s so the user sees the analyzing message
      setTimeout(() => {
        setShowSubmit(false)
        setSubmitAnalyzing(false)
      }, 3000)
    } finally { setSubmitLoading(false) }
  }, [submitFile, submitRank, tokens?.idToken, activeConv, sendConv])

  // ── Derived display name ──────────────────────────────────────────────────
  const convName = activeConv.type === 'GLOBAL'
    ? ROOMS.find(r => r.id === activeConv.room)?.label ?? activeConv.room
    : activeConv.type === 'DM'
      ? activeConv.conv.members.find(m => m.userId !== currentUser?.id)?.user.username ?? 'DM'
      : activeConv.conv.challenge?.title ?? 'Défi'

  if (!mounted || !tokens || !currentUser) return null

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden" style={{ background: '#030b1a', color: 'white' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {(sidebarOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed md:relative md:translate-x-0 z-30 h-full w-72 shrink-0 flex flex-col overflow-y-auto transition-transform duration-[250ms] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#00165F', borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50"
              style={{ color: 'white' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* DMs */}
          <div className="flex items-center justify-between pr-3">
            <SectionLabel>Messages Privés</SectionLabel>
            <button onClick={() => setShowNewDm(true)} className="mt-3 p-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition text-white/60">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {dms.filter(dm => {
            const p = dm.members.find(m => m.userId !== currentUser?.id)
            return !search || p?.user?.username?.toLowerCase().includes(search.toLowerCase())
          }).map(dm => {
            const peer = dm.members.find(m => m.userId !== currentUser?.id)
            const dmVoiceRoom = `voice_dm_${[currentUser?.id, peer?.userId].filter(Boolean).sort().join('_')}`
            const isActive = activeConv.type === 'DM' && activeConv.conversationId === dm.id
            return (
              <div key={dm.id} className={`flex items-center gap-1 transition group border-l-[3px] ${isActive ? 'bg-[#0097FC]/20 border-[#0097FC]' : 'hover:bg-white/5 border-transparent'}`}>
                <button
                  onClick={() => { setActiveConv({ type: 'DM', conversationId: dm.id, conv: dm }); setSidebarOpen(false) }}
                  className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
                >
                  <div className="relative shrink-0">
                    <Avatar name={peer?.user.username ?? '?'} src={peer?.user.avatar} size={9} />
                    {peer?.user.status === 'ONLINE' && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#00165F]" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{peer?.user.username}</p>
                    <p className="text-xs text-white/40 truncate">{dm.messages[0]?.content ?? 'Nouveau message'}</p>
                  </div>
                  {dm.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#FD2E5F] text-white text-[10px] font-black flex items-center justify-center px-1">
                      {dm.unreadCount}
                    </span>
                  )}
                </button>
                {peer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); callUser(peer.userId, peer.user.username, dmVoiceRoom) }}
                    title="Appeler"
                    className="shrink-0 p-1.5 mr-1 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 transition opacity-0 group-hover:opacity-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Online players */}
          {connectedUsers.filter(u => u.id !== currentUser?.id).length > 0 && (
            <>
              <SectionLabel>En ligne ({connectedUsers.filter(u => u.id !== currentUser?.id).length})</SectionLabel>
              {connectedUsers.filter(u => u.id !== currentUser?.id).slice(0, 8).map(u => (
                <div key={u.id} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/5 transition group">
                  <button
                    onClick={async () => {
                      const conv = await openDm(u.id)
                      if (conv) { setActiveConv({ type: 'DM', conversationId: conv.id, conv }); setSidebarOpen(false) }
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="relative shrink-0">
                      <Avatar name={u.username} src={u.avatar} size={8} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#00165F]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-white truncate">{u.username}</p>
                      <p className="text-[11px] text-emerald-400/70">En ligne</p>
                    </div>
                  </button>
                  <button
                    onClick={() => callUser(u.id, u.username, `voice_dm_${[currentUser?.id, u.id].filter(Boolean).sort().join('_')}`)}
                    title="Appeler"
                    className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition text-emerald-400 hover:bg-emerald-400/10"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Challenge rooms — only active challenges (OPEN/FULL/IN_PROGRESS/VALIDATING) */}
          {(() => {
            const ACTIVE = new Set(['OPEN', 'FULL', 'IN_PROGRESS', 'VALIDATING'])
            const activeChallenges = challenges.filter(c => c.challenge?.status && ACTIVE.has(c.challenge.status))
            return (
              <>
                <SectionLabel>Salons Défis</SectionLabel>
                {activeChallenges.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-white/30 italic">Aucun défi en cours</p>
                ) : (
                  activeChallenges.filter(c => !search || c.challenge?.title.toLowerCase().includes(search.toLowerCase())).map(ch => {
                const isActive = activeConv.type === 'CHALLENGE' && activeConv.conversationId === ch.id
                const isLive = ch.challenge?.status === 'IN_PROGRESS'
                return (
                  <button
                    key={ch.id}
                    onClick={() => { setActiveConv({ type: 'CHALLENGE', conversationId: ch.id, conv: ch }); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition ${isActive ? 'bg-[#0097FC]/20 border-l-[3px] border-[#0097FC]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
                  >
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-orange-500/15 flex items-center justify-center">
                      <Swords className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-white truncate">{ch.challenge?.title ?? 'Défi'}</p>
                      <p className="text-xs text-white/40 truncate">{ch.challenge?.game}</p>
                    </div>
                    {isLive
                      ? <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FD2E5F] text-white animate-pulse">LIVE</span>
                      : ch.challenge?.status === 'COMPLETED' && <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white/50">FIN</span>
                    }
                    {ch.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#FD2E5F] text-white text-[10px] font-black flex items-center justify-center px-1">
                        {ch.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
                )}
              </>
            )
          })()}

          {/* Global channels */}
          <SectionLabel>Channels Globaux</SectionLabel>
          {ROOMS.map(r => {
            const isActive = activeConv.type === 'GLOBAL' && activeConv.room === r.id
            return (
              <button
                key={r.id}
                onClick={() => { joinRoom(r.id); setActiveConv({ type: 'GLOBAL', room: r.id }); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition ${isActive ? 'bg-[#0097FC]/20 border-l-[3px] border-[#0097FC]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
              >
                <span className="text-xl w-9 text-center">{r.label.split(' ')[0]}</span>
                <span className="text-sm text-white/80 font-medium">{r.label.split(' ').slice(1).join(' ')}</span>
                {isActive && activeConv.type === 'GLOBAL' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}

          {/* Voice channels */}
          <SectionLabel>Vocal</SectionLabel>
          {[
            { id: 'voice_global', label: 'Global', emoji: '🌍' },
          ].map(ch => {
            const count = voiceChannelCounts[ch.id] ?? 0
            const isActive = currentVoiceRoom === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => isActive ? leaveVoiceRoom() : joinVoiceRoom(ch.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition border-l-[3px] ${
                  isActive ? 'border-[#0097FC] bg-[#0097FC]/10' : 'border-transparent hover:bg-white/5'
                }`}
              >
                <span className="text-base w-9 text-center flex items-center justify-center">
                  <Volume2 className={`w-4 h-4 ${isActive ? 'text-[#0097FC]' : 'text-white/40'}`} />
                </span>
                <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-[#0097FC]' : 'text-white/70'}`}>{ch.emoji} {ch.label}</span>
                {count > 0 && (
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{count}
                  </span>
                )}
                {isActive
                  ? <motion.span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }} />
                  : null}
              </button>
            )
          })
          }
        </div>

        {/* ─ Persistent voice panel (bas sidebar, toujours visible si en vocal) ─ */}
        {isInVoice && currentVoiceRoom && (
          <PersistentVoicePanel
            room={currentVoiceRoom}
            users={voiceUsers}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onLeave={leaveVoiceRoom}
          />
        )}
      </aside>

      {/* ══ MAIN CHAT AREA ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full" style={{ minWidth: 0 }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 bg-[#00165F]/40 backdrop-blur-md border-b border-white/8 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button onClick={() => setSidebarOpen(v => !v)} className="px-3 py-1.5 rounded-xl bg-white/8 text-white/60 hover:text-white text-xs font-semibold tracking-wide md:hidden">
            Menu
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate">{convName}</span>
              {activeConv.type === 'DM' && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">DM</span>
              )}
              {activeConv.type === 'CHALLENGE' && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">DÉFI</span>
              )}
              {activeConv.type === 'GLOBAL' && (
                <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-400" />
              )}
              {isInVoice && (
                <motion.span
                  className="hidden sm:flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🎤 EN VOCAL
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Sons activés' : 'Sons désactivés'}
              aria-label={soundEnabled ? 'Couper les sons' : 'Activer les sons'}
              className={`p-2 rounded-lg transition border ${
                soundEnabled
                  ? 'bg-white/8 text-white/70 border-white/15 hover:bg-white/15'
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
              }`}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Voir le défi / Soumettre / Vocal défi */}
            {activeConv.type === 'CHALLENGE' && activeConv.conv.challengeId && (
              <>
                <Link href={`/challenges/${activeConv.conv.challengeId}`}
                  title="Voir le défi"
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/8 text-white/70 hover:bg-white/15 transition flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">👁️ Voir</span>
                </Link>
                <Link href={`/challenges/${activeConv.conv.challengeId}/calendar`}
                  title="Calendrier du défi"
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/8 text-white/70 hover:bg-white/15 transition flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">📅 Calendrier</span>
                </Link>
                {activeConv.conv.challenge?.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      onClick={() => {
                        const room = `voice_challenge_${activeConv.conv.challengeId}`
                        currentVoiceRoom === room ? leaveVoiceRoom() : joinVoiceRoom(room)
                      }}
                      title={currentVoiceRoom === `voice_challenge_${activeConv.conv.challengeId}` ? 'Quitter vocal' : 'Rejoindre vocal'}
                      className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 transition border ${
                        currentVoiceRoom === `voice_challenge_${activeConv.conv.challengeId}`
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-white/8 text-white/70 border-white/15 hover:bg-white/15'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">
                        {currentVoiceRoom === `voice_challenge_${activeConv.conv.challengeId}` ? 'Vocal ✓' : 'Vocal'}
                      </span>
                    </button>
                    <button onClick={() => setShowSubmit(true)}
                      title="Soumettre résultat"
                      className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#FD2E5F]/20 text-[#FD2E5F] border border-[#FD2E5F]/30 hover:bg-[#FD2E5F]/30 transition flex items-center gap-1">
                      <span className="text-sm leading-none">📸</span>
                      <span className="hidden sm:inline text-xs">Résultat</span>
                    </button>
                  </>
                )}
              </>
            )}
            {/* Status dot */}
            <motion.div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
              animate={isConnected ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>

        {/* ── STREAM BANNER (CHALLENGE conv with active streamUrl) ───────────── */}
        {activeConv.type === 'CHALLENGE' && streamByConv[activeConv.conversationId] && (() => {
          const info = streamByConv[activeConv.conversationId]
          const hidden = !!streamHidden[activeConv.conversationId]
          const title = info.playerName ?? activeConv.conv.challenge?.title ?? 'Match en cours'
          return (
            <div className="shrink-0 border-b border-white/8 bg-[#00165F]/30 px-3 sm:px-4 py-2.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FD2E5F] text-white animate-pulse">● LIVE</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">{title}</span>
                </div>
                <button
                  onClick={() => setStreamHidden((p) => ({ ...p, [activeConv.conversationId]: !hidden }))}
                  className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition"
                >
                  {hidden ? 'Afficher le stream ▲' : 'Masquer le stream ▼'}
                </button>
              </div>
              {!hidden && (
                <div className="max-w-3xl mx-auto">
                  <StreamPlayer streamUrl={info.streamUrl} streamType={info.streamType} />
                </div>
              )}
            </div>
          )
        })()}

        {/* ── MESSAGES ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1" style={{ minHeight: 0 }}>
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <span className="text-5xl">💬</span>
              </motion.div>
              <p className="text-sm font-bold dark:text-white/30 text-[#00165F]/30">{t('chat.noMessages')}</p>
              {activeConv.type === 'GLOBAL' && (
                <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay'} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] text-white font-bold text-sm hover:brightness-110 transition-all">
                  {t('chat.joinDiscord')}
                </a>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activeMessages.map((msg: any, i: number) => {
                const authorId = msg.author?.id ?? msg.authorId
                const authorName = msg.author?.username ?? ''
                const authorAvatar = msg.author?.avatar

                if (msg.type === 'SYSTEM') {
                  return (
                    <div key={msg.id} className="flex justify-center py-1">
                      <span className="text-xs italic text-white/40 bg-white/5 px-3 py-1 rounded-full">{msg.content}</span>
                    </div>
                  )
                }

                const isMe = authorId === currentUser.id
                const prev: any = i > 0 ? activeMessages[i - 1] : null
                const prevAuthorId = prev?.author?.id ?? prev?.authorId
                const grouped = prevAuthorId === authorId && prev?.type !== 'SYSTEM'

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${grouped ? 'mt-0.5' : 'mt-3'}`}
                  >
                    {!isMe && (
                      <div className={`shrink-0 ${grouped ? 'opacity-0 pointer-events-none' : ''}`}>
                        <Avatar name={authorName} src={authorAvatar} size={8} />
                      </div>
                    )}
                    <div className={`flex flex-col gap-0.5 max-w-[75%] sm:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && !grouped && (
                        <span className="text-xs font-bold text-[#0097FC] ml-1">{authorName}</span>
                      )}
                      <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words relative group ${
                        isMe
                          ? 'bg-gradient-to-br from-[#0097FC] to-[#003399] text-white rounded-tr-sm shadow-lg shadow-[#0097FC]/20'
                          : activeConv.type === 'DM'
                            ? 'bg-violet-500/15 border border-violet-500/20 text-white rounded-tl-sm'
                            : activeConv.type === 'CHALLENGE'
                              ? 'bg-orange-500/10 border border-orange-500/20 text-white rounded-tl-sm'
                              : 'dark:bg-white/10 bg-white text-[#00165F] dark:text-white rounded-tl-sm border dark:border-white/8'
                      }`}>
                        {msg.type === 'IMAGE' && msg.imageUrl ? (
                          <div className="relative group/image">
                            <img src={msg.imageUrl} alt="screenshot" className="max-w-full rounded-xl cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                            {isMe && activeConv.type !== 'GLOBAL' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(msg.id);
                                }}
                                disabled={deletingMsg === msg.id}
                                className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-all duration-200 p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                title="Supprimer le message"
                              >
                                {deletingMsg === msg.id ? (
                                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {msg.content && <p className="mt-2">{msg.content}</p>}
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-[10px] dark:text-white/25 text-[#00165F]/30 px-1">
                        <RelTime date={msg.createdAt ?? msg.timestamp} />
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT BAR ────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-3 sm:px-5 py-3" style={{ background: '#001050', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2">
                <EmojiPicker onSelect={(e) => setInput(p => p + e)} onClose={() => setShowEmoji(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {/* Emoji */}
            <button onClick={() => setShowEmoji(v => !v)}
              className="p-2.5 rounded-xl transition-all hover:text-[#0097FC]"
              style={{ background: showEmoji ? 'rgba(0,151,252,0.2)' : 'rgba(255,255,255,0.1)', color: showEmoji ? '#0097FC' : 'rgba(255,255,255,0.7)' }}>
              <Smile className="w-5 h-5" />
            </button>

            {/* Screenshot (challenge/DM only) */}
            {activeConv.type !== 'GLOBAL' && (
              <>
                <button onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2.5 rounded-xl transition"
                  style={{ background: 'rgba(255,255,255,0.1)', color: uploadingImage ? '#0097FC' : 'rgba(255,255,255,0.7)' }}
                  title="Envoyer une image">
                  {uploadingImage ? <span className="w-5 h-5 block border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleScreenshot(f); e.target.value = '' }} />
              </>
            )}

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={`Message ${convName}…`}
                maxLength={500}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition placeholder:text-white/40"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
              />
              {input.length > 400 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${input.length >= 490 ? 'text-red-400' : 'text-[#0097FC]/60'}`}>
                  {500 - input.length}
                </span>
              )}
            </div>

            {/* Send */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim()}
              whileTap={{ scale: 0.92 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-[#0097FC] to-[#003399] text-white shadow-lg shadow-[#0097FC]/25 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {!isConnected && (
            <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {t('chat.reconnecting')}
            </p>
          )}
          {uploadError && (
            <p className="text-[11px] text-orange-400 mt-1.5">
              ⚠️ {uploadError}
            </p>
          )}
        </div>
      </div>

      {/* ══ VOICE MODAL ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showVoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVoice(false)} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
            <div className="fixed top-20 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }} className="w-full max-w-lg pointer-events-auto">
                <div className="bg-[#00165F] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">🎙 {t('chat.members')}</h3>
                    <button onClick={() => setShowVoice(false)} className="p-2 rounded-lg text-white/50 hover:bg-white/10 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <VoiceChannelList channels={[{ id: 'voice_global', name: 'Global', userCount: 0, maxUsers: 10 }]} currentVoiceRoom={currentVoiceRoom}
                      onJoin={(id) => { joinVoiceRoom(id); setShowVoice(false) }} />
                    {isInVoice && currentVoiceRoom && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <VoiceRoom room={currentVoiceRoom} users={voiceUsers} isMuted={isMuted}
                          onToggleMute={toggleMute} onLeave={leaveVoiceRoom} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ══ NEW DM MODAL ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showNewDm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNewDm(false)} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
            <div className="fixed top-24 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }} className="w-full max-w-md pointer-events-auto">
                <div className="bg-[#00165F] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Nouveau message</h3>
                    <button onClick={() => setShowNewDm(false)} className="p-2 rounded-lg text-white/50 hover:bg-white/10 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 mb-3">
                      <Search className="w-4 h-4 text-white/40" />
                      <input value={dmSearch} onChange={e => setDmSearch(e.target.value)} placeholder="Rechercher un joueur..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none" autoFocus />
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {/* Friends Section */}
                      {!dmSearch && friendsList && friendsList.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2 px-1">Amis</h4>
                          <div className="space-y-1">
                            {friendsList.slice(0, 8).map(friend => (
                              <button key={friend.id} onClick={async () => {
                                const conv = await openDm(friend.id)
                                if (conv) { setActiveConv({ type: 'DM', conversationId: conv.id, conv }); setShowNewDm(false); setDmSearch('') }
                              }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition">
                                <div className="relative">
                                  <Avatar name={friend.username} src={friend.avatar} size={9} />
                                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#00165F] ${
                                    friend.status === 'ONLINE' ? 'bg-emerald-500' :
                                    friend.status === 'AWAY' ? 'bg-yellow-500' :
                                    friend.status === 'IN_GAME' ? 'bg-red-500' : 'bg-gray-500'
                                  }`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-sm text-white font-medium">{friend.username}</p>
                                  <p className="text-xs text-white/40">
                                    {friend.status === 'ONLINE' ? 'En ligne' :
                                     friend.status === 'AWAY' ? 'Absent' :
                                     friend.status === 'IN_GAME' ? 'En jeu' : 'Hors ligne'}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Search Results */}
                      {dmSearch && (
                        <div>
                          <h4 className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2 px-1">Résultats</h4>
                          {dmSearching && <p className="text-xs text-white/40 text-center py-4">Recherche...</p>}
                          <div className="space-y-1">
                            {dmResults.map(u => (
                              <button key={u.id} onClick={async () => {
                                const conv = await openDm(u.id)
                                if (conv) { setActiveConv({ type: 'DM', conversationId: conv.id, conv }); setShowNewDm(false); setDmSearch('') }
                              }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition">
                                <Avatar name={u.username} src={u.avatar} size={9} />
                                <span className="text-sm text-white font-medium">{u.username}</span>
                              </button>
                            ))}
                          </div>
                          {!dmSearching && dmSearch && dmResults.length === 0 && (
                            <p className="text-xs text-white/40 text-center py-4">Aucun joueur trouvé</p>
                          )}
                        </div>
                      )}
                      
                      {/* Empty State */}
                      {!dmSearch && (!friendsList || friendsList.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-sm text-white/40 mb-3">Aucun ami pour le moment</p>
                          <p className="text-xs text-white/30">Recherchez un joueur pour commencer une conversation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ══ SUBMIT RESULT MODAL ══════════════════════════════════ */}
      <AnimatePresence>
        {showSubmit && activeConv.type === 'CHALLENGE' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSubmit(false)} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
            <div className="fixed top-24 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }} className="w-full max-w-md pointer-events-auto">
                <div className="bg-[#00165F] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                      {submitAnalyzing ? '� Analyse en cours' : '� Soumettre mon résultat'}
                    </h3>
                    <button onClick={() => { setShowSubmit(false); setSubmitAnalyzing(false) }} className="p-2 rounded-lg text-white/50 hover:bg-white/10 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {submitAnalyzing ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <p className="text-cyan-400 font-bold text-lg mb-1 animate-pulse">🔍 Analyse IA en cours…</p>
                      <p className="text-white/50 text-sm">Notre système vérifie ton screenshot automatiquement.</p>
                      <p className="text-white/40 text-xs mt-3">Tu peux fermer cette fenêtre, le résultat apparaîtra dans le défi.</p>
                    </div>
                  ) : (
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Ma place finale</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(r => (
                          <button key={r} onClick={() => setSubmitRank(r)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition ${submitRank === r ? 'bg-[#0097FC] text-white' : 'bg-white/8 text-white/60 hover:bg-white/15'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Screenshot (obligatoire)</label>
                      <button onClick={() => submitFileInputRef.current?.click()}
                        className={`w-full py-8 rounded-xl border-2 border-dashed transition text-sm ${submitFile ? 'border-[#0097FC] bg-[#0097FC]/10 text-[#0097FC]' : 'border-white/20 text-white/40 hover:border-white/40'}`}>
                        {submitFile ? `✓ ${submitFile.name}` : '+ Ajouter screenshot'}
                      </button>
                      <input ref={submitFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setSubmitFile(f); e.target.value = '' }} />
                    </div>
                    <button onClick={handleSubmitResult} disabled={!submitFile || submitLoading}
                      className="w-full py-3 rounded-xl bg-[#0097FC] text-white font-bold disabled:opacity-40 transition hover:brightness-110">
                      {submitLoading ? 'Envoi...' : 'Confirmer mon résultat'}
                    </button>
                  </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Incoming call modal */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={(call) => acceptCall(call)}
        onDecline={(call) => declineCall(call)}
      />

      {/* Outgoing call toast */}
      <AnimatePresence>
        {callingUser && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#00165F] border border-[#0097FC]/40 rounded-2xl shadow-2xl px-4 py-3"
          >
            <motion.span
              className="w-3 h-3 rounded-full bg-emerald-400 shrink-0"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
            <span className="text-sm text-white">
              Appel vers <span className="font-bold">{callingUser.targetUsername}</span>...
            </span>
            <button
              onClick={cancelCall}
              className="ml-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              title="Annuler"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice error */}
      <AnimatePresence>
        {voiceError && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 bg-red-500/90 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-xl z-50 text-sm font-medium">
            {voiceError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
