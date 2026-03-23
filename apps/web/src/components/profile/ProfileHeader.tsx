import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ProfileHeader({
  username,
  rank,
}: {
  username: string
  rank: string
}) {
  return (
    <Card variant="glass" className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-black/25 border border-secondary/35 shadow-glow-blue" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="title-tech text-secondary font-extrabold text-2xl">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="title-tech text-white text-3xl font-extrabold">{username}</h1>
            <p className="text-white/60 mt-1">Player profile • competitive identity</p>
          </div>
          <Badge variant="danger">{rank}</Badge>
        </div>
      </div>
    </Card>
  )
}
