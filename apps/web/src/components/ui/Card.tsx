import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  variant?: 'surface' | 'glass'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow, variant = 'surface', children, ...props }, ref) => {
    const variants: Record<NonNullable<CardProps['variant']>, string> = {
      surface: 'bg-white/5 border-white/10',
      glass: 'bg-white/5 border-white/10 backdrop-blur-md',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6 border shadow-depth-1 transition duration-300',
          variants[variant],
          glow && 'hover:shadow-glow-blue hover:border-secondary hover:-translate-y-0.5',
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
