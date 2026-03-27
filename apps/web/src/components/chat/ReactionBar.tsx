import React, { useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

type ReactionState = {
  [emoji: string]: { count: number; users: string[] };
};

type ReactionBarProps = {
  reactions: ReactionState;
  onReact: (emoji: string) => void;
  currentUser: string;
  availableEmojis?: string[];
};

const DEFAULT_EMOJIS = ['👍', '🔥', '😂', '😊', '🎮'];

export default function ReactionBar({
  reactions,
  onReact,
  currentUser,
  availableEmojis = DEFAULT_EMOJIS,
}: ReactionBarProps) {
  // Pour chaque emoji, détecter si currentUser a réagi
  return (
    <div className="flex items-center gap-2 mt-1">
      {Object.entries(reactions).map(([emoji, entry]) => {
        const reacted = entry.users.includes(currentUser);
        return (
          <motion.button
            key={emoji}
            type="button"
            className={`flex items-center px-2 py-1 rounded-full bg-black/30 border border-white/10 text-lg transition-transform ${
              reacted ? 'ring-2 ring-primary/60 bg-primary/10' : ''
            }`}
            whileTap={{ scale: 1.2 }}
            whileHover={{ scale: 1.08 }}
            animate={reacted ? { scale: [1, 1.18, 1], boxShadow: ['0 0 0 0 #fff0', '0 0 8px 2px #3b82f6aa', '0 0 0 0 #fff0'] } : {}}
            transition={reacted ? { duration: 0.35 } : {}}
            onClick={() => onReact(emoji)}
            aria-label={`Réagir avec ${emoji}`}
          >
            <span>{emoji}</span>
            <motion.span
              className="ml-1 text-xs text-white/70"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.25 }}
              key={entry.count}
            >
              {entry.count > 1 ? entry.count : ''}
            </motion.span>
          </motion.button>
        );
      })}
      <div className="flex items-center gap-1 ml-2">
        {availableEmojis.map((emoji) => (
          <motion.button
            key={emoji}
            type="button"
            className="px-1 py-1 rounded-full text-lg text-white/80 hover:bg-white/10 transition"
            whileTap={{ scale: 1.3 }}
            onClick={() => onReact(emoji)}
            aria-label={`Ajouter ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
