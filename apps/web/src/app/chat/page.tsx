'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Smile, Zap, Plus, Search, X, ArrowLeft, Paperclip, Swords, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useChat } from '@/hooks/useChat'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useConversations, Conversation, ConvMessage } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import EmojiPicker from '@/components/chat/EmojiPicker'
import VoiceChannelList from '@/components/voice/VoiceChannelList'
import VoiceRoom from '@/components/voice/VoiceRoom'
import VoiceIndicator from '@/components/voice/VoiceIndicator'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const ROOMS = [
  { id: 'global', label: '🌍 Global' },
  { id: 'fr',     label: '🇫🇷 Français' },
  { id: 'en',     label: '🇬🇧 English' },
]

const VOICE_CHANNELS = [
  { id: 'voice_global', name: 'Global',   userCount: 0, maxUsers: 10 },
  { id: 'voice_fr',     name: 'Français', userCount: 0, maxUsers: 10 },
  { id: 'voice_en',     name: 'English',  userCount: 0, maxUsers: 10 },
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

  // Submit result modal
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitRank, setSubmitRank] = useState(1)
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Voice
  const [showVoice, setShowVoice] = useState(false)

  // Input
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitFileInputRef = useRef<HTMLInputElement>(null)

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { messages: globalMsgs, connectedUsers, currentRoom, isConnected, socket, sendMessage: sendGlobal, joinRoom } = useChat()
  const { isInVoice, currentVoiceRoom, voiceUsers, isMuted, error: voiceError, joinVoiceRoom, leaveVoiceRoom, toggleMute } = useVoiceChat({ socket, isConnected })
  const { dms, challenges, openDm, markAsRead } = useConversations(socket)
  const convId = activeConv.type !== 'GLOBAL' ? activeConv.conversationId : null
  const { messages: convMsgs, sendMessage: sendConv, sendImage } = useMessages(convId, socket)

  // Auth redirect
  useEffect(() => { if (!tokens) router.push('/') }, [tokens, router])

  // Active messages (global or conversation)
  const activeMessages = activeConv.type === 'GLOBAL' ? globalMsgs : convMsgs

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeMessages])

  // Mark as read when switching conversation
  useEffect(() => {
    if (activeConv.type !== 'GLOBAL') markAsRead(activeConv.conversationId)
  }, [activeConv, markAsRead])

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
    if (!tokens?.idToken) return
    setUploadingImage(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/chat/upload-screenshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.idToken}` },
        body: form,
      })
      if (!res.ok) return
      const { url } = await res.json()
      sendImage(url)
    } finally {
      setUploadingImage(false)
    }
  }, [tokens?.idToken, sendImage])

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
      setShowSubmit(false)
      setSubmitFile(null)
    } finally { setSubmitLoading(false) }
  }, [submitFile, submitRank, tokens?.idToken, activeConv, sendConv])

  // ── Derived display name ──────────────────────────────────────────────────
  const convName = activeConv.type === 'GLOBAL'
    ? ROOMS.find(r => r.id === activeConv.room)?.label ?? activeConv.room
    : activeConv.type === 'DM'
      ? activeConv.conv.members.find(m => m.userId !== currentUser?.id)?.user.username ?? 'DM'
      : activeConv.conv.challenge?.title ?? 'Défi'

  if (!tokens || !currentUser) return null

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 top-16 bottom-20 flex overflow-hidden" style={{ background: '#030b1a', color: 'white' }}>

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
        className={`fixed md:relative md:translate-x-0 z-30 flex h-full w-72 flex-col shrink-0 overflow-hidden transition-transform duration-[250ms] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
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
          {dms.filter(d => !search || d.members.some(m => m.user.username.toLowerCase().includes(search.toLowerCase()))).map(dm => {
            const peer = dm.members.find(m => m.userId !== currentUser.id)
            const isActive = activeConv.type === 'DM' && activeConv.conversationId === dm.id
            return (
              <button
                key={dm.id}
                onClick={() => { setActiveConv({ type: 'DM', conversationId: dm.id, conv: dm }); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition ${isActive ? 'bg-[#0097FC]/20 border-l-[3px] border-[#0097FC]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
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
            )
          })}

          {/* Challenge rooms */}
          {challenges.length > 0 && (
            <>
              <SectionLabel>Salons Défis</SectionLabel>
              {challenges.filter(c => !search || c.challenge?.title.toLowerCase().includes(search.toLowerCase())).map(ch => {
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
              })}
            </>
          )}

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

          {/* Voice */}
          <SectionLabel>Vocal</SectionLabel>
          <button
            onClick={() => setShowVoice(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/5 border-l-[3px] ${isInVoice ? 'border-[#0097FC] bg-[#0097FC]/10' : 'border-transparent'}`}
          >
            <span className="text-xl w-9 text-center">🎙</span>
            <span className="text-sm text-white/80 font-medium">{isInVoice ? `Connecté` : 'Rejoindre vocal'}</span>
            {isInVoice && <span className="ml-auto w-2 h-2 rounded-full bg-[#0097FC] animate-pulse" />}
          </button>
        </div>
      </aside>

      {/* ══ MAIN CHAT AREA ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 bg-[#00165F]/40 backdrop-blur-md border-b border-white/8 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-xl bg-white/8 text-white/60 md:hidden">
            <Search className="w-4 h-4" />
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
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Voir le défi / Soumettre */}
            {activeConv.type === 'CHALLENGE' && activeConv.conv.challengeId && (
              <>
                <Link href={`/challenges/${activeConv.conv.challengeId}`}
                  className="px-2.5 py-1.5 rounded-lg bg-white/8 text-xs text-white/70 hover:bg-white/15 transition flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5" /> Voir
                </Link>
                {activeConv.conv.challenge?.status === 'IN_PROGRESS' && (
                  <button onClick={() => setShowSubmit(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FD2E5F]/20 text-xs text-[#FD2E5F] border border-[#FD2E5F]/30 hover:bg-[#FD2E5F]/30 transition">
                    📸 Résultat
                  </button>
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

        {/* ── MESSAGES ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1" style={{ minHeight: 0 }}>
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <span className="text-5xl">💬</span>
              </motion.div>
              <p className="text-sm font-bold dark:text-white/30 text-[#00165F]/30">{t('chat.noMessages')}</p>
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
                      <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-br from-[#0097FC] to-[#003399] text-white rounded-tr-sm shadow-lg shadow-[#0097FC]/20'
                          : activeConv.type === 'DM'
                            ? 'bg-violet-500/15 border border-violet-500/20 text-white rounded-tl-sm'
                            : activeConv.type === 'CHALLENGE'
                              ? 'bg-orange-500/10 border border-orange-500/20 text-white rounded-tl-sm'
                              : 'dark:bg-white/10 bg-white text-[#00165F] dark:text-white rounded-tl-sm border dark:border-white/8'
                      }`}>
                        {msg.type === 'IMAGE' && msg.imageUrl
                          ? <img src={msg.imageUrl} alt="screenshot" className="max-w-full rounded-xl cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                          : msg.content
                        }
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

        {/* ── DISCORD BUTTON (global only) ─────────────────────── */}
        {activeConv.type === 'GLOBAL' && (
          <div className="shrink-0 px-3 sm:px-5 py-2 border-t border-white/8">
            <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay'} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#5865F2] text-white font-bold text-sm hover:brightness-110 transition-all">
              {t('chat.joinDiscord')}
            </a>
          </div>
        )}

        {/* ── INPUT BAR ────────────────────────────────────────── */}
        <div className="shrink-0 px-3 sm:px-5 py-3" style={{ background: '#001050', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
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
                    <VoiceChannelList channels={VOICE_CHANNELS} currentVoiceRoom={currentVoiceRoom}
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
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {dmSearching && <p className="text-xs text-white/40 text-center py-4">Recherche...</p>}
                      {dmResults.map(u => (
                        <button key={u.id} onClick={async () => {
                          const conv = await openDm(u.id)
                          if (conv) { setActiveConv({ type: 'DM', conversationId: conv.id, conv }); setShowNewDm(false); setDmSearch('') }
                        }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition">
                          <Avatar name={u.username} src={u.avatar} size={9} />
                          <span className="text-sm text-white font-medium">{u.username}</span>
                        </button>
                      ))}
                      {!dmSearching && dmSearch && dmResults.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">Aucun joueur trouvé</p>
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
                    <h3 className="text-lg font-bold text-white">📸 Soumettre mon résultat</h3>
                    <button onClick={() => setShowSubmit(false)} className="p-2 rounded-lg text-white/50 hover:bg-white/10 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Voice indicator */}
      {isInVoice && currentVoiceRoom && (
        <VoiceIndicator roomName={currentVoiceRoom.replace('voice_', '').replace('_', ' ')}
          isMuted={isMuted} onToggleMute={toggleMute} onLeave={leaveVoiceRoom} />
      )}

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
