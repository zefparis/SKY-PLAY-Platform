'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import ChatLayout from '@/components/chat/ChatLayout'
import ChatInput from '@/components/chat/ChatInput'
import MessageList from '@/components/chat/MessageList'
import { Message } from '@/components/chat/MessageBubble'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'm1',
      userId: 'system',
      author: 'SKY PLAY',
      content: 'Bienvenue dans le chat. Ready to compete ?',
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: false,
      readBy: ['system'],
    },
    {
      id: 'm2',
      userId: 'me',
      author: 'Me',
      content: 'Let’s go.',
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      readBy: ['me'],
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const header = useMemo(() => {
    return (
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="title-tech text-white text-2xl font-extrabold">Chat</h1>
          <p className="text-white/60">Team up, trash talk, coordinate.</p>
        </div>
      </div>
    )
  }, [])

  const send = (value: string) => {
    const createdAt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: 'me',
        author: 'Me',
        content: value,
        isMe: true,
        createdAt,
        readBy: ['me'],
      },
    ])
  }

  return (
    <div className="min-h-screen">
      <main className="pb-12">
        <Container>
          <div className="mb-8">{header}</div>

          <ChatLayout>
            <Card variant="glass" className="p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10">
                <p className="title-tech text-sm text-white/85"># general</p>
              </div>

              <div
                ref={listRef}
                className="h-[55vh] overflow-y-auto px-6 py-5 space-y-4"
              >
                <MessageList
                  messages={messages}
                  reactions={{}}
                  onReact={() => {}}
                  currentUser="Me"
                />
              </div>

              <div className="px-6 py-5 border-t border-white/10 bg-black/15">
                <ChatInput onSend={send} />
              </div>
            </Card>
          </ChatLayout>
        </Container>
      </main>
    </div>
  )
}
