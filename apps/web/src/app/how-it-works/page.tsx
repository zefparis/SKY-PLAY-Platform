'use client'

import { motion } from 'framer-motion'
import {
  Trophy, Zap, Star, TrendingUp, Sparkles,
  Users, CheckCircle, Clock, Camera, BarChart3,
  Calendar, Medal, Crown, Target, Tv, Megaphone,
  Lock, Gamepad2, ChevronRight, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/components/i18n/I18nProvider'

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

// ─── Static (non-translated) data ───────────────────────────────────
const HOW_STEPS = [
  {
    n: '1',
    icon: UserPlus,
    color: '#00c8ff',
    title: 'Rejoins une compétition',
    bullets: [
      'Choisis ton format (Duel, Challenge, Tournoi, Championnat)',
      'Accepte le règlement',
      'C’est parti',
    ],
  },
  {
    n: '2',
    icon: Gamepad2,
    color: '#ffd700',
    title: 'Joue et prouve ta valeur',
    bullets: [
      'Joue le match sur ta console ou ton PC',
      'Soumets ton résultat avec une capture d’écran',
      'Le système valide automatiquement',
    ],
  },
  {
    n: '3',
    icon: TrendingUp,
    color: '#FD2E5F',
    title: 'Grimpe dans les Leagues',
    bullets: [
      'Chaque victoire te rapporte des SKY Points',
      'Monte de Bronze jusqu’à Gloire',
      'Accède aux compétitions exclusives',
    ],
  },
]

const LEAGUE_TIERS = [
  { emoji: '🥉', name: 'Bronze',  pts: '10 000',  color: '#cd7f32' },
  { emoji: '🥈', name: 'Argent',  pts: '25 000',  color: '#c0c0c0' },
  { emoji: '🥇', name: 'Or',      pts: '40 000',  color: '#ffd700' },
  { emoji: '💎', name: 'Diamant', pts: '60 000',  color: '#00c8ff' },
  { emoji: '⚡', name: 'Legend',  pts: '80 000',  color: '#b06fff' },
  { emoji: '🏆', name: 'Gloire',  pts: '100 000', color: '#ff4081' },
]

const MODULE_META = [
  { id: 1, titleKey: 'hiw.m1.title', badgeKey: 'hiw.m1.badge', color: '#00c8ff', icon: Gamepad2,
    items: [{ icon: Zap, key: 'hiw.m1.i1' }, { icon: Clock, key: 'hiw.m1.i2' }, { icon: Camera, key: 'hiw.m1.i3' }, { icon: BarChart3, key: 'hiw.m1.i4' }] },
  { id: 2, titleKey: 'hiw.m2.title', badgeKey: 'hiw.m2.badge', color: '#ffd700', icon: Calendar,
    items: [{ icon: Calendar, key: 'hiw.m2.i1' }, { icon: TrendingUp, key: 'hiw.m2.i2' }, { icon: Target, key: 'hiw.m2.i3' }, { icon: Trophy, key: 'hiw.m2.i4' }] },
  { id: 3, titleKey: 'hiw.m3.title', badgeKey: 'hiw.m3.badge', color: '#00e676', icon: Trophy,
    items: [{ icon: Users, key: 'hiw.m3.i1' }, { icon: Target, key: 'hiw.m3.i2' }, { icon: Medal, key: 'hiw.m3.i3' }, { icon: CheckCircle, key: 'hiw.m3.i4' }] },
  { id: 4, titleKey: 'hiw.m4.title', badgeKey: 'hiw.m4.badge', color: '#b06fff', icon: Crown,
    items: [{ icon: Users, key: 'hiw.m4.i1' }, { icon: Target, key: 'hiw.m4.i2' }, { icon: Medal, key: 'hiw.m4.i3' }, { icon: Sparkles, key: 'hiw.m4.i4' }] },
  { id: 5, titleKey: 'hiw.m5.title', badgeKey: 'hiw.m5.badge', color: '#00c8ff', colorEnd: '#b06fff', icon: Star, isLeague: true, items: [] },
  { id: 6, titleKey: 'hiw.m6.title', badgeKey: 'hiw.m6.badge', color: '#ff9800', icon: Megaphone,
    items: [{ icon: Tv, key: 'hiw.m6.i1' }, { icon: Megaphone, key: 'hiw.m6.i2' }, { icon: Sparkles, key: 'hiw.m6.i3' }, { icon: BarChart3, key: 'hiw.m6.i4' }] },
]

const V2_META = [
  { icon: Gamepad2, titleKey: 'hiw.v2.1.title', descKey: 'hiw.v2.1.desc' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl font-black dark:text-white text-[#00165F] mb-3">{children}</h2>
      {sub && <p className="dark:text-white/50 text-[#00165F]/50 text-base max-w-xl mx-auto">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen dark:bg-[#080c18] bg-gray-50">

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-20 pt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #0097FC 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div {...fadeUp(0)} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border dark:border-[#0097FC]/30 border-[#0097FC]/20 dark:bg-[#0097FC]/10 bg-[#0097FC]/5 text-[#0097FC] text-sm font-bold">
              {t('hiw.hero.badge')}
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.08)}
            className="text-3xl sm:text-5xl font-black dark:text-white text-[#00165F] leading-tight mb-6"
          >
            {t('hiw.hero.title1')}
            <span className="block" style={{ background: 'linear-gradient(135deg, #0097FC, #00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('hiw.hero.title2')}
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.12)}
            className="text-base sm:text-lg dark:text-white/60 text-[#00165F]/60 max-w-2xl mx-auto mb-10"
          >
            {t('hiw.hero.sub')}
          </motion.p>

          <motion.div {...fadeUp(0.16)} className="flex flex-wrap gap-3 justify-center">
            <Link href="/challenges"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0097FC, #003399)' }}
            >
              <Trophy className="w-4 h-4" /> {t('hiw.hero.cta.join')}
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold dark:border-white/15 border-[#00165F]/20 dark:text-white/80 text-[#00165F]/80 border dark:bg-white/5 bg-white hover:border-[#0097FC]/50 transition-colors"
            >
              {t('hiw.hero.cta.account')} <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 1 — HOW SKYPLAY AFRICA WORKS (3 STEPS)
      ═════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)}>
            <SectionTitle sub="Trois étapes pour passer du gamer occasionnel à la légende.">
              Comment fonctionne SKYPLAY AFRICA ?
            </SectionTitle>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-[78px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.n} {...fadeUp(0.08 * (i + 1))}
                  className="relative dark:bg-[#0d1124] bg-white rounded-2xl border dark:border-white/10 border-[#00165F]/10 p-7 hover:shadow-xl transition-shadow"
                  style={{ boxShadow: `0 0 0 1px ${step.color}10` }}
                >
                  {/* Icon + step number */}
                  <div className="relative w-16 h-16 mb-5 mx-auto">
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-40" style={{ backgroundColor: step.color }} />
                    <div className="relative w-full h-full rounded-2xl flex items-center justify-center border-2"
                      style={{ borderColor: step.color, backgroundColor: `${step.color}18` }}>
                      <Icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full dark:bg-[#080c18] bg-white border-2 flex items-center justify-center text-xs font-black"
                      style={{ borderColor: step.color, color: step.color }}>
                      {step.n}
                    </div>
                  </div>

                  <h3 className="text-lg font-black dark:text-white text-[#00165F] text-center mb-4">
                    {step.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {step.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm dark:text-white/70 text-[#00165F]/70">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: step.color }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — FEATURES
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 dark:bg-[#0a0d1a] bg-[#f0f4ff]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)}>
            <SectionTitle sub={t('hiw.s2.sub')}>{t('hiw.s2.title')}</SectionTitle>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULE_META.map((mod) => {
              const Icon = mod.icon
              const isGradient = !!mod.colorEnd
              const badgeStyle = isGradient
                ? { background: `linear-gradient(135deg, ${mod.color}, ${mod.colorEnd})`, color: '#fff' }
                : { background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}30` }

              return (
                <motion.div key={mod.id} {...fadeUp(0.05 * mod.id)}
                  className="dark:bg-[#0d1124] bg-white rounded-2xl border dark:border-white/8 border-[#00165F]/10 p-6 flex flex-col gap-4 hover:shadow-xl transition-shadow"
                  style={{ boxShadow: `0 0 0 1px ${mod.color}10` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${mod.color}18` }}>
                        <Icon className="w-5 h-5" style={{ color: mod.color }} />
                      </div>
                      <h3 className="text-lg font-black dark:text-white text-[#00165F]">{t(mod.titleKey)}</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={badgeStyle}>
                      {t(mod.badgeKey)}
                    </span>
                  </div>

                  {mod.isLeague ? (
                    <div className="grid grid-cols-2 gap-2">
                      {LEAGUE_TIERS.map((tier) => (
                        <div key={tier.name} className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-[#00165F]/5">
                          <span className="text-lg">{tier.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold" style={{ color: tier.color }}>{tier.name}</p>
                            <p className="text-[10px] dark:text-white/40 text-[#00165F]/40">{tier.pts} pts</p>
                          </div>
                        </div>
                      ))}
                      <p className="col-span-2 text-xs dark:text-white/50 text-[#00165F]/50 mt-1">{t('hiw.m5.note')}</p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {mod.items.map((item, i) => {
                        const ItemIcon = item.icon
                        return (
                          <li key={i} className="flex items-start gap-2.5 text-sm dark:text-white/70 text-[#00165F]/70">
                            <ItemIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: mod.color }} />
                            {t(item.key)}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — V2 ROADMAP
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp(0)}>
            <SectionTitle sub={t('hiw.s3.sub')}>{t('hiw.s3.title')}</SectionTitle>
          </motion.div>

          <div className="flex justify-center">
            {V2_META.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div key={i} {...fadeUp(0.07 * (i + 1))}
                  className="relative dark:bg-[#0d1124]/60 bg-white/60 rounded-2xl border dark:border-white/8 border-[#00165F]/8 p-6 opacity-70 w-full max-w-sm"
                >
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/50 text-[9px] font-black uppercase tracking-wider">
                      <Lock className="w-2.5 h-2.5" /> {t('hiw.v2.cs')}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl dark:bg-white/8 bg-[#00165F]/6 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 dark:text-white/40 text-[#00165F]/40" />
                  </div>
                  <h3 className="text-base font-black dark:text-white/70 text-[#00165F]/70 mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm dark:text-white/40 text-[#00165F]/40 leading-relaxed">{t(item.descKey)}</p>
                </motion.div>
              )
            })}
          </div>

          {/* CTA */}
          <motion.div {...fadeUp(0.3)} className="mt-14 text-center">
            <div className="inline-block p-px rounded-2xl" style={{ background: 'linear-gradient(135deg, #0097FC, #b06fff)' }}>
              <div className="dark:bg-[#080c18] bg-white rounded-2xl px-8 py-6">
                <p className="text-xl font-black dark:text-white text-[#00165F] mb-2">{t('hiw.cta.title')}</p>
                <p className="dark:text-white/50 text-[#00165F]/50 text-sm mb-5">{t('hiw.cta.sub')}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/login"
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg, #0097FC, #003399)' }}
                  >
                    {t('hiw.cta.btn1')}
                  </Link>
                  <Link href="/challenges"
                    className="px-6 py-2.5 rounded-xl font-bold text-sm dark:border-white/15 border-[#00165F]/20 dark:text-white/80 text-[#00165F]/80 border dark:bg-white/5 bg-[#00165F]/5 hover:border-[#0097FC]/50 transition-colors"
                  >
                    {t('hiw.cta.btn2')}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
