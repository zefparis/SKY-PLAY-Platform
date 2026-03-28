'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

type StatCardProps = {
  title: string
  value: string | number
  change?: string
  icon: LucideIcon
  color?: string
}

export default function StatCard({ title, value, change, icon: Icon, color = '#0097FC' }: StatCardProps) {
  const isPositive = change?.startsWith('+')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-3 sm:p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium dark:text-white/60 text-[#00165F]/60 mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-3xl font-black dark:text-white text-[#00165F] leading-tight" style={{ fontFamily: 'Dena, sans-serif' }}>
            {value}
          </p>
          {change && (
            <p className={`text-xs font-semibold mt-1 sm:mt-2 truncate ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div
          className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  )
}
