import Hero from '@/components/home/Hero'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import { Gamepad2, Trophy, Wallet } from 'lucide-react'

export default function Home() {
  return (
    <main>
      <Hero />

      <section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Trophy,
                title: 'Challenges',
                desc: 'Crée et rejoins des défis compétitifs.',
              },
              {
                icon: Wallet,
                title: 'Wallet',
                desc: 'Gère tes dépôts, gains et retraits.',
              },
              {
                icon: Gamepad2,
                title: 'Dashboard',
                desc: 'Suis tes matchs, stats et performances.',
              },
            ].map((item) => (
              <Card
                key={item.title}
                glow
                className="flex items-start gap-4"
              >
                <div className="mt-1 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue">
                  <item.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="title-tech text-lg font-extrabold text-white">
                    {item.title}
                  </h3>
                  <p className="text-white/70 mt-1">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </main>
  )
}
