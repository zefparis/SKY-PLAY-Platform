import Card from '@/components/ui/Card'
import { Trophy, Swords, Gamepad2, TrendingUp } from 'lucide-react'

export type ProfileStats = {
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
}

export default function StatsGrid({ stats }: { stats: ProfileStats }) {
  const items = [
    { label: 'Games', value: stats.gamesPlayed, icon: Gamepad2 },
    { label: 'Wins', value: stats.wins, icon: Trophy },
    { label: 'Losses', value: stats.losses, icon: Swords },
    { label: 'Winrate', value: `${stats.winRate}%`, icon: TrendingUp },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {items.map((it) => (
        <Card key={it.label} glow variant="glass" className="p-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue flex items-center justify-center shrink-0">
              <it.icon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-primary/70 dark:text-white/60 text-xs sm:text-sm title-tech truncate">{it.label}</p>
              <p className="text-primary dark:text-white text-xl sm:text-2xl font-extrabold tabular-nums truncate">{it.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
