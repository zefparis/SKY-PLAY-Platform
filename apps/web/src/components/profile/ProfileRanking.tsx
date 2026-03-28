'use client'

import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface RankingData {
  globalRank: number
  totalPlayers: number
  rankName: string
  points: number
  nextRankPoints: number
}

interface ProfileRankingProps {
  ranking: RankingData
}

export default function ProfileRanking({ ranking }: ProfileRankingProps) {
  const progressPercentage = (ranking.points / ranking.nextRankPoints) * 100

  const getRankBadgeVariant = (rankName: string): 'danger' | 'info' | 'success' => {
    if (rankName.includes('Diamond') || rankName.includes('Master')) return 'danger'
    if (rankName.includes('Platinum') || rankName.includes('Gold')) return 'success'
    return 'info'
  }

  const getRankIcon = (rankName: string) => {
    if (rankName.includes('Diamond') || rankName.includes('Master')) return Trophy
    if (rankName.includes('Platinum')) return Award
    return Medal
  }

  const RankIcon = getRankIcon(ranking.rankName)

  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-6">
        <h2 className="title-tech text-white text-xl font-extrabold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          Classement
        </h2>
        <Badge variant={getRankBadgeVariant(ranking.rankName)}>
          {ranking.rankName}
        </Badge>
      </div>

      {/* Rang global */}
      <div className="bg-gradient-to-br from-secondary/10 to-danger/10 rounded-xl p-6 mb-6 border border-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Rang global</p>
            <p className="text-white text-3xl font-extrabold tabular-nums">
              #{ranking.globalRank.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-secondary/20 border-2 border-secondary/40 flex items-center justify-center">
            <RankIcon className="w-8 h-8 text-secondary" />
          </div>
        </div>
        <p className="text-white/40 text-xs">
          Sur {ranking.totalPlayers.toLocaleString('fr-FR')} joueurs
        </p>
      </div>

      {/* Progression vers le prochain rang */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/60 text-sm">Progression</p>
          <p className="text-white text-sm font-semibold">
            {ranking.points.toLocaleString('fr-FR')} / {ranking.nextRankPoints.toLocaleString('fr-FR')} pts
          </p>
        </div>
        
        {/* Barre de progression */}
        <div className="relative h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-danger rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <p className="text-green-400 text-xs font-medium">
            {(ranking.nextRankPoints - ranking.points).toLocaleString('fr-FR')} pts pour le prochain rang
          </p>
        </div>
      </div>

      {/* Stats de rang */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
          <p className="text-white/60 text-xs mb-1">Points totaux</p>
          <p className="text-white text-xl font-bold tabular-nums">{ranking.points.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
          <p className="text-white/60 text-xs mb-1">Top</p>
          <p className="text-white text-xl font-bold tabular-nums">
            {((ranking.globalRank / ranking.totalPlayers) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
