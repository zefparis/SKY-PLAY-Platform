import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble, { Message } from './MessageBubble';

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

export default function MessageList({
  messages,
  reactions,
  onReact,
  currentUser,
}: MessageListProps) {
  // TODO: virtualisation, auto-scroll, unread indicator, etc.
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            variants={messageVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            layout
          >
            <MessageBubble
              message={msg}
              reactions={reactions[msg.id] || {}}
              onReact={(emoji: string) => onReact(msg.id, emoji, currentUser)}
              currentUser={currentUser}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
