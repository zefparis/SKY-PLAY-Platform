'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, Users, Hash, Globe, Languages, Menu, X, Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { useChat } from '@/hooks/useChat'
import { Message } from '@/types/chat'
import EmojiPicker from '@/components/chat/EmojiPicker'

const ROOMS = [
  { id: 'global', name: 'Global', icon: Globe },
  { id: 'fr', name: 'Français', icon: Languages },
  { id: 'en', name: 'English', icon: Languages },
]

export default function ChatPage() {
  const router = useRouter()
  const tokens = useAuthStore((state) => state.tokens)
  const currentUser = useAuthStore((state) => state.user)
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<'rooms' | 'private'>('rooms')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    privateMessages,
    connectedUsers,
    currentRoom,
    isConnected,
    sendMessage,
    sendPrivate,
    joinRoom,
  } = useChat()

  useEffect(() => {
    if (!tokens) {
      router.push('/')
    }
  }, [tokens, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) {
      return
    }

    sendMessage(inputValue.trim())
    setInputValue('')
    setShowEmojiPicker(false)
  }

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!tokens || !currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#050d1f]">
      <div className="flex h-screen relative">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-40 w-64 lg:w-[220px] bg-[#00165F] border-r border-white/10 flex flex-col transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0097FC] to-blue-600 font-black text-white shadow-lg">
                  SP
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Dena, sans-serif' }}>SP Chat</h1>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
                      animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-white/60">
                      {isConnected ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'rooms'
                  ? 'bg-white/10 text-white border-b-2 border-sky-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Salons
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'private'
                  ? 'bg-white/10 text-white border-b-2 border-sky-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Privés
            </button>
          </div>

          {activeTab === 'rooms' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {ROOMS.map((room) => {
                  const Icon = room.icon
                  const isActive = currentRoom === room.id
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        joinRoom(room.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative ${
                        isActive
                          ? 'bg-[#0097FC]/20 text-white border-l-3 border-[#0097FC]'
                          : 'text-white/70 hover:bg-white/5 hover:text-[#0097FC]'
                      }`}
                    >
                      <Hash className="h-4 w-4" />
                      <span>{room.name}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-4 border-t border-white/10 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    En ligne
                  </span>
                  <motion.div
                    className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 text-xs font-bold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {connectedUsers.length}
                  </motion.div>
                </div>
                <div className="space-y-2">
                  {connectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0097FC] to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-white/80">{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-white/50 text-center">Aucun message privé</p>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="h-16 bg-[#00165F]/30 border-b border-white/10 flex items-center px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition mr-3"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-[#0097FC]" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Dena, sans-serif' }}>
                {ROOMS.find((r) => r.id === currentRoom)?.name || currentRoom}
              </h2>
              <span className="text-sm text-white/40">• {connectedUsers.length} en ligne</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <MessageCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Aucun message</p>
                <p className="text-sm">Sois le premier à envoyer un message !</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isMe = message.author.id === currentUser.id
                  const prevMessage = index > 0 ? messages[index - 1] : null
                  const showAvatar = !prevMessage || prevMessage.author.id !== message.author.id

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md md:max-w-lg ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!isMe && showAvatar && (
                          <div className="flex items-center gap-2 px-1">
                            {message.author.avatar ? (
                              <img src={message.author.avatar} alt={message.author.username} className="h-5 w-5 rounded-full" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#0097FC] to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {message.author.username[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs font-semibold text-[#0097FC]">
                              {message.author.username}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-[#0097FC]/30 text-white border border-[#0097FC]/50'
                              : 'bg-white/5 text-white border border-white/10'
                          }`}
                        >
                          <p className="text-sm break-words" style={{ fontFamily: 'Montserrat, sans-serif' }}>{message.content}</p>
                        </div>
                        <span className="text-xs text-white/40 px-1">{formatTime(message.timestamp)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 bg-[#0a1628] p-4 pb-safe">
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 rounded-xl bg-white/8 hover:bg-white/12 transition text-white/60 hover:text-white"
                  disabled={!isConnected}
                >
                  <Smile className="h-5 w-5" />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Envoie un message..."
                disabled={!isConnected}
                className="flex-1 rounded-2xl bg-white/8 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#0097FC]/50 focus:bg-white/12 disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                maxLength={500}
              />
              <motion.button
                onClick={handleSend}
                disabled={!inputValue.trim() || !isConnected}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center rounded-xl bg-[#0097FC] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{inputValue.length}/500</span>
              {!isConnected && <span className="text-[#FD2E5F]">Déconnecté du serveur</span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
