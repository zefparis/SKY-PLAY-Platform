import React, { useRef, useState, useEffect } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

import type { Message } from './MessageBubble';

type ReactionState = {
  [messageId: string]: {
    [emoji: string]: { count: number; users: string[] };
  };
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    userId: 'u1',
    author: 'Alice',
    content: 'Salut 👋',
    createdAt: '10:00',
    readBy: ['u1', 'u2'],
  },
  {
    id: '2',
    userId: 'u2',
    author: 'Bob',
    content: 'Hello ! Prêt à jouer ? 🎮',
    createdAt: '10:01',
    isMe: true,
    readBy: ['u2'],
  },
];

const MOCK_REACTIONS: ReactionState = {
  '1': {
    '👍': { count: 2, users: ['Alice', 'Bob'] },
    '🔥': { count: 1, users: ['Bob'] },
  },
  '2': {},
};

const MOCK_USERS = [
  { id: 'u1', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alice', online: true },
  { id: 'u2', name: 'Bob', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bob', online: true },
  { id: 'u3', name: 'Benji', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Benji', online: false },
];

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [reactions, setReactions] = useState<ReactionState>(MOCK_REACTIONS);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(['u1']);
  const [onlineUsers, setOnlineUsers] = useState(MOCK_USERS.filter(u => u.online));
  const listRef = useRef<HTMLDivElement>(null);

  // Glow pulse sur nouveau message entrant (non isMe)
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    // Glow pulse si dernier message n'est pas "isMe"
    if (messages.length > 0 && !messages[messages.length - 1].isMe) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 420);
      return () => clearTimeout(t);
    }
  }, [messages]);

  // Simuler l’arrivée d’un message et l’indicateur de typing
  useEffect(() => {
    const timeout = setTimeout(() => setIsTyping(true), 2000);
    const timeout2 = setTimeout(() => {
      setIsTyping(false);
      setMessages((msgs) => [
        ...msgs,
        {
          id: String(msgs.length + 1),
          userId: 'u1',
          author: 'Alice',
          content: 'Oui, let’s go ! 😎',
          createdAt: '10:02',
          readBy: ['u1'],
        },
      ]);
    }, 4000);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, []);

  // Préparer le hook pour le son (optionnel)
  const playSendSound = () => {
    // TODO: brancher un son ici (ex: new Audio('/sounds/send.mp3').play())
  };

  const handleSend = (text: string) => {
    // UI optimiste : ajout immédiat avec status 'sending'
    const tempId = 'temp-' + Date.now();
    const newMsg = {
      id: tempId,
      userId: 'u2',
      author: 'Bob',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sending' as const,
      readBy: ['u2'],
    };
    setMessages((msgs) => [...msgs, newMsg]);
    playSendSound();

    // Simuler la confirmation serveur (remplacer par API réelle)
    setTimeout(() => {
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === tempId ? { ...m, id: String(Date.now()), status: 'sent' as const } : m
        )
      );
    }, 900);
  };

  return (
    <div
      className={`flex flex-col h-full min-h-[60vh] bg-black/10 rounded-2xl shadow-lg overflow-hidden transition-shadow duration-400 ${
        pulse ? 'shadow-[0_0_24px_0_rgba(59,130,246,0.25)]' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-black/10 sticky top-0 z-20">
        <div className="flex -space-x-2">
          {onlineUsers.map((u) => (
            <img
              key={u.id}
              src={u.avatar}
              alt={u.name}
              title={u.name}
              className="w-7 h-7 rounded-full border-2 border-white/60 bg-black/30"
              style={{ boxShadow: '0 0 4px #3b82f6aa' }}
            />
          ))}
        </div>
        <span className="text-xs text-white/60 font-medium">
          {onlineUsers.length} en ligne
        </span>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-4">
        <MessageList
          messages={messages}
          reactions={reactions}
          onReact={(messageId, emoji, user) => {
            setReactions((prev) => {
              const msgReacts = prev[messageId] || {};
              const entry = msgReacts[emoji];
              if (entry) {
                // Si l'utilisateur a déjà réagi, retire sa réaction
                if (entry.users.includes(user)) {
                  return {
                    ...prev,
                    [messageId]: {
                      ...msgReacts,
                      [emoji]: {
                        count: entry.count - 1,
                        users: entry.users.filter((u) => u !== user),
                      },
                    },
                  };
                }
                // Sinon, incrémente
                return {
                  ...prev,
                  [messageId]: {
                    ...msgReacts,
                    [emoji]: {
                      count: entry.count + 1,
                      users: [...entry.users, user],
                    },
                  },
                };
              }
              // Première réaction pour cet emoji
              return {
                ...prev,
                [messageId]: {
                  ...msgReacts,
                  [emoji]: { count: 1, users: [user] },
                },
              };
            });
          }}
          currentUser="Bob"
        />
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers.map(uid => MOCK_USERS.find(u => u.id === uid)).filter(Boolean)} />
        )}
      </div>
      <div className="border-t border-white/10 bg-black/20 px-4 py-3">
        <ChatInput onSend={handleSend} onSendSound={playSendSound} />
      </div>
    </div>
  );
}
