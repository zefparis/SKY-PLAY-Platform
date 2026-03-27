import React, { memo } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble, { Message } from './MessageBubble';

// Virtualisation légère avec react-window si >100 messages
import { FixedSizeList as List } from 'react-window';

type ReactionState = {
  [emoji: string]: { count: number; users: string[] };
};

type MessageListProps = {
  messages: Message[];
  reactions: { [messageId: string]: ReactionState };
  onReact: (messageId: string, emoji: string, user: string) => void;
  currentUser: string;
};

const containerVariants = {
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

const MemoMessageBubble = memo(MessageBubble);

export default function MessageList({
  messages,
  reactions,
  onReact,
  currentUser,
  loading = false,
  unreadId = null,
}: MessageListProps & { loading?: boolean; unreadId?: string | null }) {
  // Skeleton de chargement
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-gradient-to-r from-black/20 to-black/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Virtualisation si >100 messages
  if (messages.length > 100) {
    return (
      <List
        height={500}
        itemCount={messages.length}
        itemSize={92}
        width="100%"
        className="virtualized-message-list"
      >
        {({ index, style }: { index: number; style: CSSProperties }) => {
          const msg = messages[index];
          return (
            <div style={style} key={msg.id}>
              {unreadId && msg.id === unreadId && (
                <div className="flex items-center my-2">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="mx-2 text-xs text-primary/80 font-bold uppercase tracking-wider">
                    Non lus
                  </span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>
              )}
              <MemoMessageBubble
                message={msg}
                reactions={reactions[msg.id] || {}}
                onReact={(emoji: string) => onReact(msg.id, emoji, currentUser)}
                currentUser={currentUser}
              />
            </div>
          );
        }}
      </List>
    );
  }

  // Animation classique si <100 messages
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            {unreadId && msg.id === unreadId && (
              <div className="flex items-center my-2">
                <div className="flex-1 h-px bg-white/15" />
                <span className="mx-2 text-xs text-primary/80 font-bold uppercase tracking-wider">
                  Non lus
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>
            )}
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              layout
            >
              <MemoMessageBubble
                message={msg}
                reactions={reactions[msg.id] || {}}
                onReact={(emoji: string) => onReact(msg.id, emoji, currentUser)}
                currentUser={currentUser}
              />
            </motion.div>
          </React.Fragment>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
