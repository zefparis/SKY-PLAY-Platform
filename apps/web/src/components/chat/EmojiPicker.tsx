'use client'

import { useState } from 'react'

const EMOJI_CATEGORIES = {
  Smileys: ['😀', '😂', '😍', '😎', '🤩', '�', '🥳', '�', '�', '�'],
  Gaming: ['🎮', '�️', '🏆', '�', '🎲', '⚔️', '�️', '💥', '🔥', '⚡'],
  Réactions: ['👍', '👎', '❤️', '�💯', '�', '�', '�', '🤝', '🫶', '😈'],
  'SKY PLAY': ['🌟', '💎', '🚀', '👑', '🎪', '🏅', '🎖️', '🥇', '💰', '🎁'],
}

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys')

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 mb-2 z-50 rounded-xl bg-[#0a1628] border border-white/10 shadow-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
              className={`px-3 py-2 text-xs font-medium transition ${
                activeCategory === category
                  ? 'bg-[#0097FC]/20 text-[#0097FC] border-b-2 border-[#0097FC]'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 p-3 w-64">
          {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="text-2xl hover:scale-125 transition-transform focus:outline-none p-2 rounded-lg hover:bg-white/10"
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
