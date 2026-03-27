'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Trophy, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useI18n } from '@/components/i18n/I18nProvider'

const Hero = () => {
  const { t } = useI18n()

  // Generate stars only on client to avoid SSR hydration mismatch
  const [stars, setStars] = useState<Array<{
    id: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }>>([])

  useEffect(() => {
    setStars(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      }))
    )
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-1 h-1 bg-secondary rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
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
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-primary mb-6 sm:mb-8 glow-blue"
          >
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 px-4">
            <span className="text-gradient">SKY PLAY</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/75 mb-3 sm:mb-4 max-w-3xl mx-auto px-4">
            {t('hero.tagline')}
          </p>
          
          <p className="text-sm sm:text-base md:text-lg text-white/65 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            <Link href="/challenges" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:min-w-[200px]">
                <Trophy className="w-5 h-5 mr-2" />
                {t('hero.cta.joinChallenge')}
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:min-w-[200px]">
                <Zap className="w-5 h-5 mr-2" />
                {t('hero.cta.viewDashboard')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto px-4">
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
                className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10 hover:border-secondary/40 transition-all duration-300 hover:shadow-glow-blue"
              >
                <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mb-3 sm:mb-4 mx-auto" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-white/65">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Hero
