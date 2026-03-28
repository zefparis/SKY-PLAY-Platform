'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, Users, Hash, Globe, Languages, Trophy } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useChat } from '@/hooks/useChat'
import { Message } from '@/types/chat'

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
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="flex h-screen">
        <aside className="w-64 bg-[#00165F] border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 font-black text-white shadow-lg">
                SP
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Chat</h1>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-white/60">
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
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
                      onClick={() => joinRoom(room.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-sky-400/20 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{room.name}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-4 border-t border-white/10 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-white/60" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    En ligne ({connectedUsers.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {connectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
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
          <header className="h-16 bg-[#00165F]/30 border-b border-white/10 flex items-center px-6">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">
                {ROOMS.find((r) => r.id === currentRoom)?.name || currentRoom}
              </h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <MessageCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Aucun message</p>
                <p className="text-sm">Sois le premier à envoyer un message !</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.author.id === currentUser.id
                return (
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-xs font-semibold text-white/60 px-1">
                          {message.author.username}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMe
                            ? 'bg-[#0097FC]/20 text-white border border-[#0097FC]/30'
                            : 'bg-white/5 text-white border border-white/10'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <span className="text-xs text-white/40 px-1">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 bg-[#00165F]/20 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Envoie un message..."
                disabled={!isConnected}
                className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-sky-400/50 focus:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !isConnected}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span>{inputValue.length}/500 caractères</span>
              {!isConnected && <span className="text-red-400">Déconnecté du serveur</span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
