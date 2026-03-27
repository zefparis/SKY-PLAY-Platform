import React from 'react';
import { motion } from 'framer-motion';

type TypingIndicatorProps = {
  users?: { name: string; color?: string }[];
};

export default function TypingIndicator({ users = [{ name: 'L’utilisateur' }] }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        {users.map((u, idx) => (
          <span key={u.name} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full border-2 border-white/60"
              style={{
                background: u.color || 'linear-gradient(135deg,#3b82f6 60%,#f472b6 100%)',
                boxShadow: '0 0 6px 1px #3b82f6aa',
                display: 'inline-block',
              }}
            />
            <span className="text-white/70 text-xs font-medium">{u.name}</span>
            {idx < users.length - 1 && <span className="text-white/30 text-xs">,</span>}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 ml-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-white/70"
            animate={{
              y: [0, -6, 0],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
