import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  variant?: 'surface' | 'glass'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow, variant = 'surface', children, ...props }, ref) => {
    const variants: Record<NonNullable<CardProps['variant']>, string> = {
      surface: 'dark:bg-[#0a0f1e] bg-white dark:border-white/10 border-[#00165F]/15',
      glass: 'dark:bg-[#0a0f1e]/50 bg-white/50 dark:border-white/10 border-[#00165F]/15 backdrop-blur-md',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6 border dark:shadow-depth-1 shadow-sm transition duration-300',
          variants[variant],
          glow && 'hover:shadow-glow-blue dark:hover:border-secondary hover:border-[#0097FC] hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
