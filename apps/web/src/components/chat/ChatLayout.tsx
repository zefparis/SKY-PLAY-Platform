'use client'

import { ReactNode } from 'react'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export default function ChatLayout({
  sidebar,
  children,
  className,
  header,
}: {
  sidebar?: ReactNode
  children: ReactNode
  className?: string
  header?: ReactNode
}) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6', className)}>
      <Card variant="glass" className="hidden lg:block p-0 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="title-tech text-white text-sm">Rooms</h2>
          <p className="text-white/60 text-sm mt-1">
            Placeholder — intégration realtime plus tard.
          </p>
        </div>
        <div className="p-3 space-y-2">
          {sidebar ?? (
            <div className="rounded-md border border-white/10 bg-black/25 p-4">
              <p className="text-white/70 text-sm"># general</p>
            </div>
          )}
        </div>
      </Card>

      <div className="min-h-[70vh] relative">
        {header && (
          <div className="sticky top-0 z-10 bg-gradient-to-b from-black/40 to-transparent px-6 py-4 border-b border-white/10 shadow-[0_2px_12px_0_rgba(59,130,246,0.08)] backdrop-blur-md">
            {header}
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-2 pointer-events-none z-20">
          <div className="h-2 w-full bg-gradient-to-b from-primary/20 to-transparent opacity-70" />
        </div>
        {children}
      </div>
    </div>
  )
}
