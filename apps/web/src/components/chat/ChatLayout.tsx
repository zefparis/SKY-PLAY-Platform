'use client'

import { ReactNode } from 'react'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export default function ChatLayout({
  sidebar,
  children,
  className,
}: {
  sidebar?: ReactNode
  children: ReactNode
  className?: string
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

      <div className="min-h-[70vh]">{children}</div>
    </div>
  )
}
