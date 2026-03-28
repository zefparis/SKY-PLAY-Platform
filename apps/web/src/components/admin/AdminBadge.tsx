'use client'

type AdminBadgeProps = {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variants = {
  default: 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70',
  success: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
}

export default function AdminBadge({ status, variant = 'default' }: AdminBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant]}`}>
      {status}
    </span>
  )
}
