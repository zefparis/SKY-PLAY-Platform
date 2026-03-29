'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Smile, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { useChat } from '@/hooks/useChat'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import EmojiPicker from '@/components/chat/EmojiPicker'
import VoiceChannelList from '@/components/voice/VoiceChannelList'
import VoiceRoom from '@/components/voice/VoiceRoom'
import VoiceIndicator from '@/components/voice/VoiceIndicator'

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

function Avatar({ name, src, size = 7 }: { name: string; src?: string; size?: number }) {
  const s = `w-${size} h-${size}`
  return src ? (
    <img src={src} alt={name} className={`${s} rounded-full object-cover ring-2 ring-white/10`} />
  ) : (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-xs`}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const tokens = useAuthStore((s) => s.tokens)
  const currentUser = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, connectedUsers, currentRoom, isConnected, socket, sendMessage, joinRoom } = useChat()
  const { isInVoice, currentVoiceRoom, voiceUsers, isMuted, error: voiceError, joinVoiceRoom, leaveVoiceRoom, toggleMute } = useVoiceChat({ socket, isConnected })

  useEffect(() => { if (!tokens) router.push('/') }, [tokens, router])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = () => {
    if (!input.trim() || !isConnected) return
    sendMessage(input.trim())
    setInput('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const fmt = (d: Date) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  if (!tokens || !currentUser) return null

  return (
    <div className={`flex flex-col dark:bg-[#030b1a] bg-[#f0f4ff] overflow-hidden ${isInVoice ? 'h-[calc(100dvh-64px-48px)]' : 'h-[calc(100dvh-64px)]'} pb-20 md:pb-0`}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 sm:px-5 py-2.5 dark:bg-[#00165F]/40 bg-white/80 backdrop-blur-md border-b dark:border-white/8 border-[#00165F]/8">
        <div className="flex items-center justify-between gap-3">

          {/* Room pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {ROOMS.map(r => (
              <button
                key={r.id}
                onClick={() => joinRoom(r.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  currentRoom === r.id
                    ? 'bg-gradient-to-r from-[#0097FC] to-[#003399] text-white shadow-lg shadow-[#0097FC]/30 scale-105'
                    : 'dark:bg-white/8 bg-[#00165F]/6 dark:text-white/60 text-[#00165F]/60 hover:dark:bg-white/14 hover:bg-[#00165F]/10'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Online pill */}
            <button
              onClick={() => setShowOnline(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full dark:bg-emerald-400/10 bg-emerald-50 border dark:border-emerald-400/20 border-emerald-200 transition hover:scale-105"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-500">{connectedUsers.length}</span>
            </button>

            {/* Voice pill */}
            <button
              onClick={() => setShowVoice(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition hover:scale-105 text-xs font-bold ${
                isInVoice
                  ? 'bg-[#0097FC]/20 border-[#0097FC]/40 text-[#0097FC]'
                  : 'dark:bg-white/8 bg-[#00165F]/6 dark:border-white/10 border-[#00165F]/10 dark:text-white/50 text-[#00165F]/50'
              }`}
            >
              🎙 {isInVoice ? 'Vocal' : 'Rejoindre'}
            </button>

            {/* Status dot */}
            <motion.div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
              animate={isConnected ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </div>

      {/* ── ONLINE PANEL (slide-down) ──────────────────────────── */}
      <AnimatePresence>
        {showOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden shrink-0"
          >
            <div className="px-4 py-3 dark:bg-[#00165F]/20 bg-white/60 border-b dark:border-white/8 border-[#00165F]/8">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {connectedUsers.length === 0 ? (
                  <span className="text-xs dark:text-white/40 text-[#00165F]/40">Aucun utilisateur en ligne</span>
                ) : (
                  connectedUsers.map(u => (
                    <div key={u.id} className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative">
                        <Avatar name={u.username} src={u.avatar} size={8} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 dark:ring-[#030b1a] ring-white" />
                      </div>
                      <span className="text-[10px] dark:text-white/50 text-[#00165F]/50 max-w-[40px] truncate">{u.username}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VOICE PANEL (modal overlay) ───────────────────────────── */}
      <AnimatePresence>
        {showVoice && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoice(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl mx-auto px-4"
            >
              <div className="dark:bg-[#00165F] bg-white rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b dark:border-white/10 border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold dark:text-white text-[#00165F]">🎙 Salons vocaux</h3>
                  <button onClick={() => setShowVoice(false)} className="p-2 rounded-lg dark:text-white/50 text-[#00165F]/50 hover:dark:bg-white/10 hover:bg-gray-100 transition">
                    ✕
                  </button>
                </div>
                <div className="px-5 py-4">
                  <VoiceChannelList
                    channels={VOICE_CHANNELS}
                    currentVoiceRoom={currentVoiceRoom}
                    onJoin={(id) => { joinVoiceRoom(id); setShowVoice(false) }}
                  />
                  {isInVoice && currentVoiceRoom && (
                    <div className="mt-4 pt-4 border-t dark:border-white/10 border-gray-200">
                      <VoiceRoom
                        room={currentVoiceRoom}
                        users={voiceUsers}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        onLeave={leaveVoiceRoom}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MESSAGES ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl"
            >
              💬
            </motion.div>
            <p className="text-base font-bold dark:text-white/30 text-[#00165F]/30">Aucun message pour l'instant</p>
            <p className="text-sm dark:text-white/20 text-[#00165F]/20">Lance la conversation !</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMe = msg.author.id === currentUser.id
              const prev = i > 0 ? messages[i - 1] : null
              const grouped = prev?.author.id === msg.author.id
              const showName = !isMe && !grouped

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${grouped ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Avatar (left for others only) */}
                  {!isMe && (
                    <div className={`shrink-0 ${grouped ? 'opacity-0 pointer-events-none' : ''}`}>
                      <Avatar name={msg.author.username} src={msg.author.avatar} size={8} />
                    </div>
                  )}

                  <div className={`flex flex-col gap-0.5 max-w-[72%] sm:max-w-[55%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {showName && (
                      <span className="text-xs font-bold text-[#0097FC] ml-1">{msg.author.username}</span>
                    )}

                    <div className="group relative">
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isMe
                            ? 'bg-gradient-to-br from-[#0097FC] to-[#003399] text-white rounded-tr-sm shadow-lg shadow-[#0097FC]/20'
                            : 'dark:bg-white/10 bg-white text-[#00165F] dark:text-white rounded-tl-sm shadow-sm dark:shadow-none border dark:border-white/8 border-[#00165F]/8'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-[10px] dark:text-white/25 text-[#00165F]/30 mt-0.5 block ${isMe ? 'text-right' : 'text-left'} px-1`}>
                        {fmt(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR ─────────────────────────────────────────── */}
      <div className="shrink-0 px-3 sm:px-5 py-3 dark:bg-[#00165F]/20 bg-white/80 backdrop-blur-md border-t dark:border-white/8 border-[#00165F]/8">

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="mb-2"
            >
              <EmojiPicker
                onSelect={(e) => { setInput(p => p + e) }}
                onClose={() => setShowEmoji(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Emoji button */}
          <button
            onClick={() => setShowEmoji(v => !v)}
            disabled={!isConnected}
            className={`p-2.5 rounded-xl transition-all ${showEmoji ? 'dark:bg-[#0097FC]/20 bg-[#0097FC]/10 text-[#0097FC]' : 'dark:bg-white/8 bg-[#00165F]/6 dark:text-white/40 text-[#00165F]/40 hover:text-[#0097FC]'} disabled:opacity-40`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={isConnected ? `Message #${ROOMS.find(r => r.id === currentRoom)?.label.split(' ')[1] || currentRoom}…` : 'Connexion…'}
              disabled={!isConnected}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/8 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 dark:text-white text-[#00165F] dark:placeholder:text-white/30 placeholder:text-[#00165F]/30 text-sm focus:outline-none focus:border-[#0097FC]/50 dark:focus:bg-white/12 focus:bg-[#0097FC]/5 transition disabled:opacity-50"
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
            disabled={!input.trim() || !isConnected}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-[#0097FC] to-[#003399] text-white shadow-lg shadow-[#0097FC]/25 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {!isConnected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> Reconnexion en cours…
          </motion.p>
        )}
      </div>

      {/* Barre vocale persistante */}
      {isInVoice && currentVoiceRoom && (
        <VoiceIndicator
          roomName={currentVoiceRoom.replace('voice_', '').replace('_', ' ')}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onLeave={leaveVoiceRoom}
        />
      )}

      {/* Voice error toast */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 bg-red-500/90 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-xl z-50 text-sm font-medium"
          >
            {voiceError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
