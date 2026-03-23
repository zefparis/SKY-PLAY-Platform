import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export type Message = {
  id: string
  author: string
  content: string
  isMe?: boolean
  createdAt: string
}

export default function MessageBubble({ message }: { message: Message }) {
  if (message.isMe) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="rounded-lg bg-secondary text-white px-4 py-3 shadow-glow-blue">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="mt-1 text-right text-xs text-white/55">
            {message.createdAt}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[70%]">
        <Card
          variant="glass"
          className={cn('p-4 border-secondary/20')}
        >
          <div className="flex items-center justify-between gap-4 mb-1">
            <p className="text-white font-semibold text-sm">{message.author}</p>
            <p className="text-xs text-white/55">{message.createdAt}</p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </Card>
      </div>
    </div>
  )
}
