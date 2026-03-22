import Hero from '@/components/home/Hero'

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <Hero />
      <h1>SKY PLAY</h1>
      <p>Gaming challenges, tournaments, wallet, leaderboard, chat, PWA.</p>
      <ul>
        <li>Auth & Player Profiles</li>
        <li>Paid Challenges</li>
        <li>Wallet & Mobile Money</li>
        <li>Leaderboard & Stats</li>
        <li>Realtime Chat</li>
      </ul>
    </main>
  )
}
