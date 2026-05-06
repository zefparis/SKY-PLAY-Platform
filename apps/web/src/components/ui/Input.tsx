import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost'
}

/**
 * SKYPLAY AFRICA input: dark surface, electric focus ring, structured geometry.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base =
      'w-full rounded-md border px-4 py-3 text-white placeholder:text-white/50 outline-none transition duration-200'

    const variants: Record<NonNullable<InputProps['variant']>, string> = {
      default:
        'bg-white/5 border-white/10 hover:border-white/20 focus:border-secondary focus:shadow-glow-blue',
      ghost:
        'bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20 focus:border-secondary focus:shadow-glow-blue',
    }

    return (
      <input
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
