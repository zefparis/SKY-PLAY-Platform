import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import ReactionBar from './ReactionBar'

export type Message = {
  id: string
  userId: string
  author: string
  content: string
  type?: 'TEXT' | 'IMAGE' | 'SYSTEM'
  imageUrl?: string
  isMe?: boolean
  createdAt: string
  status?: 'sending' | 'sent' | 'delivered'
  reactions?: { emoji: string; userIds: string[] }[]
  readBy?: string[]
  threadId?: string
  pinned?: boolean
  system?: boolean
  xp?: number
  badges?: string[]
  streak?: number
}

type ReactionState = {
  [emoji: string]: { count: number; users: string[] };
};

type MessageBubbleProps = {
  message: Message;
  reactions: ReactionState;
  onDelete?: (messageId: string) => void;
  onReact: (emoji: string) => void;
  currentUser: string;
};

export default function MessageBubble({
  message,
  onDelete,
  reactions,
  onReact,
  currentUser,
}: MessageBubbleProps) {
  // Mock users pour read receipts (à remplacer par vrai mapping userId/avatar)
  const users: Record<string, { name: string; avatar: string }> = {
    u1: { name: 'Alice', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alice' },
    u2: { name: 'Bob', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bob' },
  };

  if (message.system) {
    return (
      <div className="flex justify-center my-2">
        <motion.div
          className="px-4 py-2 text-center italic text-primary/70 dark:text-white/60 text-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {message.content}
        </motion.div>
      </div>
    );
  }

  if (message.isMe) {
    return (
      <div className="flex justify-end">
        <motion.div
          className="max-w-[85%] sm:max-w-[70%]"
          whileHover={{ scale: 1.015, boxShadow: '0 0 12px 0 #3b82f633' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="rounded-lg bg-secondary text-white px-4 py-3 shadow-glow-blue border border-blue-400/30 hover:border-blue-400/60 transition relative group">
            {message.type === 'IMAGE' && message.imageUrl ? (
              <div className="relative">
                <img 
                  src={message.imageUrl} 
                  alt="Image partagée" 
                  className="max-w-full rounded-lg cursor-pointer" 
                  onClick={() => window.open(message.imageUrl, '_blank')}
                />
                {message.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap pr-8">{message.content}</p>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 bg-black/40 backdrop-blur-sm"
                title="Supprimer le message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
          <div className="mt-1 text-right text-xs text-primary/60 dark:text-white/55 flex flex-col items-end gap-1">
            <span>{message.createdAt}</span>
            {message.readBy && message.readBy.length > 1 && (
              <motion.div
                className="flex -space-x-2 items-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {message.readBy
                  .filter((uid) => uid !== message.userId)
                  .map((uid) =>
                    users[uid] ? (
                      <img
                        key={uid}
                        src={users[uid].avatar}
                        alt={users[uid].name}
                        title={`Vu par ${users[uid].name}`}
                        className="w-5 h-5 rounded-full border-2 border-white/60 bg-black/30"
                        style={{ boxShadow: '0 0 4px #3b82f6aa' }}
                      />
                    ) : null
                  )}
              </motion.div>
            )}
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
            'p-4 border-2 border-gradient-to-br from-pink-400/30 to-blue-400/30 hover:border-pink-400/60 transition group'
          )}
        >
          <div className="flex items-center justify-between gap-4 mb-1">
            <p className="text-primary dark:text-white font-semibold text-sm">{message.author}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-primary/60 dark:text-white/55">{message.createdAt}</p>
              {onDelete && message.author === currentUser && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 bg-black/20 backdrop-blur-sm"
                  title="Supprimer le message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {message.type === 'IMAGE' && message.imageUrl ? (
            <div className="mb-2">
              <img 
                src={message.imageUrl} 
                alt="Image partagée" 
                className="max-w-full rounded-lg cursor-pointer" 
                onClick={() => window.open(message.imageUrl, '_blank')}
              />
              {message.content && (
                <p className="text-sm text-primary/90 dark:text-white/80 leading-relaxed whitespace-pre-wrap mt-2">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-primary/90 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
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
