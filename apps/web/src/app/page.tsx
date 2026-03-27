"use client"

import dynamic from 'next/dynamic'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import { Gamepad2, Trophy, Wallet } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

const Hero = dynamic(() => import('@/components/home/Hero'), { ssr: false })

export default function Home() {
  const { t } = useI18n()

  return (
    <main>
      <Hero />

      <section className="pb-12 sm:pb-16">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Trophy,
                title: t('home.card.challenges.title'),
                desc: t('home.card.challenges.desc'),
              },
              {
                icon: Wallet,
                title: t('home.card.wallet.title'),
                desc: t('home.card.wallet.desc'),
              },
              {
                icon: Gamepad2,
                title: t('home.card.dashboard.title'),
                desc: t('home.card.dashboard.desc'),
              },
            ].map((item) => (
              <Card
                key={item.title}
                glow
                className="flex items-start gap-3 sm:gap-4"
              >
                <div className="mt-1 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue shrink-0">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="title-tech text-base sm:text-lg font-extrabold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 mt-1">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </main>
  )
}
