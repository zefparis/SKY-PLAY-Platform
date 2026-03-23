'use client'

import { motion } from 'framer-motion'
import { Gamepad2, Trophy, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useI18n } from '@/components/i18n/I18nProvider'

const Hero = () => {
  const { t } = useI18n()

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-secondary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 glow-blue"
          >
            <Gamepad2 className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="text-gradient">SKY PLAY</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/75 mb-4 max-w-3xl mx-auto">
            {t('hero.tagline')}
          </p>
          
          <p className="text-lg text-white/65 mb-12 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/challenges">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                <Trophy className="w-5 h-5 mr-2" />
                {t('hero.cta.joinChallenge')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                <Zap className="w-5 h-5 mr-2" />
                {t('hero.cta.viewDashboard')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Trophy, title: t('hero.feature.compete.title'), desc: t('hero.feature.compete.desc') },
              { icon: Gamepad2, title: t('hero.feature.play.title'), desc: t('hero.feature.play.desc') },
              { icon: Zap, title: t('hero.feature.win.title'), desc: t('hero.feature.win.desc') },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-secondary/40 transition-all duration-300 hover:shadow-glow-blue"
              >
                <feature.icon className="w-8 h-8 text-secondary mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/65">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Hero
