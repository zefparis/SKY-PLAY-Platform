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
    author: 'Alice',
    content: 'Salut 👋',
    createdAt: '10:00',
  },
  {
    id: '2',
    author: 'Bob',
    content: 'Hello ! Prêt à jouer ? 🎮',
    createdAt: '10:01',
    isMe: true,
  },
];

const MOCK_REACTIONS: ReactionState = {
  '1': {
    '👍': { count: 2, users: ['Alice', 'Bob'] },
    '🔥': { count: 1, users: ['Bob'] },
  },
  '2': {},
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [reactions, setReactions] = useState<ReactionState>(MOCK_REACTIONS);
  const [isTyping, setIsTyping] = useState(false);
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
          author: 'Alice',
          content: 'Oui, let’s go ! 😎',
          createdAt: '10:02',
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
      author: 'Bob',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sending' as const,
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
        {isTyping && <TypingIndicator />}
      </div>
      <div className="border-t border-white/10 bg-black/20 px-4 py-3">
        <ChatInput onSend={handleSend} onSendSound={playSendSound} />
      </div>
    </div>
  );
}
