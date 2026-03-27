import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import ReactionBar from './ReactionBar'

export type Message = {
  id: string
  author: string
  content: string
  isMe?: boolean
  createdAt: string
  status?: 'sending' | 'sent' | 'delivered'
}

type ReactionState = {
  [emoji: string]: { count: number; users: string[] };
};

type MessageBubbleProps = {
  message: Message;
  reactions: ReactionState;
  onReact: (emoji: string) => void;
  currentUser: string;
};

export default function MessageBubble({
  message,
  reactions,
  onReact,
  currentUser,
}: MessageBubbleProps) {
  if (message.isMe) {
    return (
      <div className="flex justify-end">
        <motion.div
          className="max-w-[85%] sm:max-w-[70%]"
          whileHover={{ scale: 1.015, boxShadow: '0 0 12px 0 #3b82f633' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="rounded-lg bg-secondary text-white px-4 py-3 shadow-glow-blue border border-blue-400/30 hover:border-blue-400/60 transition relative">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <ReactionBar
              reactions={reactions}
              onReact={onReact}
              currentUser={currentUser}
            />
            {message.status === 'sending' && (
              <span className="absolute top-2 right-2">
                <span className="inline-block w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              </span>
            )}
            {message.status === 'sent' && (
              <span className="absolute top-2 right-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-400/70" title="Envoyé" />
              </span>
            )}
            {message.status === 'delivered' && (
              <span className="absolute top-2 right-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-400/70" title="Reçu" />
              </span>
            )}
          </div>
          <div className="mt-1 text-right text-xs text-white/55">
            {message.createdAt}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <motion.div
        className="max-w-[85%] sm:max-w-[70%]"
        whileHover={{ scale: 1.015, boxShadow: '0 0 12px 0 #f472b633' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Card
          variant="glass"
          className={cn(
            'p-4 border-2 border-gradient-to-br from-pink-400/30 to-blue-400/30 hover:border-pink-400/60 transition'
          )}
        >
          <div className="flex items-center justify-between gap-4 mb-1">
            <p className="text-white font-semibold text-sm">{message.author}</p>
            <p className="text-xs text-white/55">{message.createdAt}</p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <ReactionBar
            reactions={reactions}
            onReact={onReact}
            currentUser={currentUser}
          />
        </Card>
      </motion.div>
    </div>
  )
}
