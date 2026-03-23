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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((it) => (
        <Card key={it.label} glow variant="glass" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue flex items-center justify-center">
              <it.icon className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-white/60 text-sm title-tech">{it.label}</p>
              <p className="text-white text-2xl font-extrabold">{it.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
