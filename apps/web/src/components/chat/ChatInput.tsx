'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Smile } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

export default function ChatInput({
  onSend,
  disabled,
  onSendSound,
}: {
  onSend: (value: string) => void
  disabled?: boolean
  onSendSound?: () => void
}) {
  const [value, setValue] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    if (onSendSound) onSendSound()
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e as any)
    }
  }

  const insertEmoji = (emoji: string) => {
    const ref = textareaRef.current
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const newValue = value.slice(0, start) + emoji + value.slice(end)
    setValue(newValue)
    setShowEmoji(false)
    setTimeout(() => {
      ref.focus()
      ref.selectionStart = ref.selectionEnd = start + emoji.length
    }, 0)
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-3 relative">
      <div className="relative">
        <button
          type="button"
          className="text-xl text-primary/70 dark:text-white/70 hover:text-secondary dark:hover:text-primary transition"
          onClick={() => setShowEmoji((v) => !v)}
          tabIndex={-1}
          aria-label="Ouvrir le sélecteur d’emojis"
        >
          <Smile />
        </button>
        {showEmoji && (
          <div className="absolute bottom-full left-0 mb-2 z-20">
            <EmojiPicker onSelect={insertEmoji} />
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écris ton message…"
        disabled={disabled}
        rows={1}
        className="bg-white/40 dark:bg-black/20 resize-none rounded-lg px-3 py-2 text-primary dark:text-white text-sm w-full focus:outline-none border border-primary/20 dark:border-white/10 focus:border-secondary dark:focus:border-primary/60 transition placeholder:text-primary/50 dark:placeholder:text-white/50"
        style={{ minHeight: 40, maxHeight: 120 }}
      />
      <motion.button
        type="submit"
        disabled={disabled}
        className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow-glow-blue hover:shadow-lg focus:outline-none transition"
        whileTap={{ scale: 0.96, boxShadow: '0 0 0 4px #3b82f6aa' }}
        aria-label="Envoyer"
      >
        <Send className="w-4 h-4 mr-2" />
        Envoyer
      </motion.button>
    </form>
  )
}
