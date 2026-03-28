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
      className="bg-white dark:bg-[#00165F]/40 rounded-2xl p-6 border dark:border-white/10 border-[#00165F]/10 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium dark:text-white/60 text-[#00165F]/60 mb-1">{title}</p>
          <p className="text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
            {value}
          </p>
          {change && (
            <p className={`text-xs font-semibold mt-2 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  )
}
