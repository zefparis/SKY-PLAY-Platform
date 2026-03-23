'use client'

import { FormEvent, useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Send } from 'lucide-react'

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Écris ton message…"
        disabled={disabled}
        variant="ghost"
        className="bg-black/20"
      />
      <Button type="submit" variant="primary" disabled={disabled} className="shrink-0">
        <Send className="w-4 h-4 mr-2" />
        Send
      </Button>
    </form>
  )
}
