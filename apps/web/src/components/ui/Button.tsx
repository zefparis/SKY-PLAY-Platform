import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-md transition duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
    
    // CTA: electric blue / Accent actions: red / Text: white on dark
    const variants = {
      primary:
        'bg-secondary text-white shadow-depth-1 hover:shadow-glow-blue hover:-translate-y-0.5',
      secondary:
        'bg-primary text-white/95 border border-white/10 shadow-depth-1 hover:border-white/20 hover:-translate-y-0.5',
      accent:
        'bg-accent text-white shadow-depth-1 hover:shadow-glow-red hover:-translate-y-0.5',
      outline:
        'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-white hover:shadow-glow-blue',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-3 text-base',
      lg: 'px-7 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
