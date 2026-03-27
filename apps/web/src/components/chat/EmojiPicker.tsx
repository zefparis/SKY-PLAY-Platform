import React from 'react';

const EMOJIS = [
  '😀', '😂', '😍', '😎', '😊', '👍', '🔥', '🥳', '😭', '😡', '🤔', '🎮', '💯', '😏', '😱', '😇'
];

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  className?: string;
};

export default function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <div
      className={`grid grid-cols-8 gap-2 p-2 rounded-xl bg-black/80 border border-white/10 shadow-lg ${className ?? ''}`}
      style={{ width: 240 }}
      role="listbox"
      aria-label="Sélecteur d’emojis"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="text-2xl hover:scale-110 transition-transform focus:outline-none"
          onClick={() => onSelect(emoji)}
          aria-label={`Insérer ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
