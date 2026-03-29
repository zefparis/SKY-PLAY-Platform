'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Smile, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { useI18n } from '@/components/i18n/I18nProvider'
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
  const { t } = useI18n()
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

  const fmt = (d: Date) => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

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
              🎙 {isInVoice ? '🎙' : t('chat.joinDiscord').split(' ')[0]}
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
                  <span className="text-xs dark:text-white/40 text-[#00165F]/40">{connectedUsers.length} {t('chat.online')}</span>
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
                  <h3 className="text-lg font-bold dark:text-white text-[#00165F]">🎙 {t('chat.members')}</h3>
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
            <p className="text-base font-bold dark:text-white/30 text-[#00165F]/30">{t('chat.noMessages')}</p>
            <p className="text-sm dark:text-white/20 text-[#00165F]/20">{t('chat.beFirst')}</p>
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
                      <div className="flex items-center gap-1.5 ml-1">
                        <span className="text-xs font-bold text-[#0097FC]">{msg.author.username}</span>
                        {(msg.author as any).discordTag && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#5865F2]/10 border border-[#5865F2]/20">
                            <svg width="10" height="10" viewBox="0 0 71 55" fill="none">
                              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
                            </svg>
                          </div>
                        )}
                      </div>
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

      {/* ── DISCORD BUTTON ────────────────────────────────────── */}
      <div className="shrink-0 px-3 sm:px-5 py-2 border-t dark:border-white/8 border-[#00165F]/8">
        <a
          href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#5865F2] text-white font-bold text-sm shadow-lg shadow-[#5865F2]/30 hover:brightness-110 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 71 55" fill="none">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
          </svg>
          {t('chat.joinDiscord')}
        </a>
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
              placeholder={isConnected ? `${t('chat.messagePlaceholder')} #${ROOMS.find(r => r.id === currentRoom)?.label.split(' ')[1] || currentRoom}…` : t('chat.connecting')}
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
            <Zap className="w-3 h-3" /> {t('chat.reconnecting')}
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
