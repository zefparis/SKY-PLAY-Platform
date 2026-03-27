import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export type MatchItem = {
  id: string
  opponent: string
  result: 'WIN' | 'LOSS'
  date: string
  game: string
}

export default function MatchHistory({ matches }: { matches: MatchItem[] }) {
  return (
    <Card variant="glass">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
        <h2 className="title-tech text-white text-lg sm:text-xl font-extrabold">Match history</h2>
        <p className="text-white/60 text-xs sm:text-sm">Last {matches.length}</p>
      </div>

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 sm:px-4 transition duration-200 hover:border-white/20"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base break-words">{m.game}</p>
                <p className="text-white/60 text-xs sm:text-sm break-words">vs {m.opponent} • {m.date}</p>
              </div>
              <div className="flex justify-start sm:justify-end">
                <Badge variant={m.result === 'WIN' ? 'success' : 'danger'} className="shrink-0 px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">{m.result}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
