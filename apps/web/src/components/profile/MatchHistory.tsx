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
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="title-tech text-white text-xl font-extrabold">Match history</h2>
        <p className="text-white/60 text-sm">Last {matches.length}</p>
      </div>

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4 py-3 transition duration-200 hover:border-white/20"
          >
            <div>
              <p className="text-white font-semibold">{m.game}</p>
              <p className="text-white/60 text-sm">vs {m.opponent} • {m.date}</p>
            </div>
            <Badge variant={m.result === 'WIN' ? 'success' : 'danger'}>{m.result}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
