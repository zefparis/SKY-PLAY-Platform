import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'info' | 'success' | 'danger'
}

/**
 * Badge with strict brand colors.
 * - success/info: electric blue (no green allowed by guidelines)
 * - danger: accent red
 */
export default function Badge({ className, variant = 'info', ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    info: 'bg-secondary/15 text-secondary border-secondary/30',
    success: 'bg-secondary/15 text-secondary border-secondary/30',
    danger: 'bg-accent/15 text-accent border-accent/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
