'use client'

import { motion } from 'framer-motion'
import {
  Trophy, Zap, Star, Shield, TrendingUp, Sparkles,
  Users, CheckCircle, Clock, Camera, BarChart3,
  Calendar, Medal, Crown, Target, Tv, Megaphone,
  Lock, Gamepad2, ChevronRight,
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

// ─── Static (non-translated) data ─────────────────────────────────────────────
const MATCH_META = [
  { key: 'hiw.mt.duel',    players: 2,   entry: '2 000',   pot: '4 000',     gains: '3 000',   comm: '1 000',  rate: '25%', color: '#00c8ff' },
  { key: 'hiw.mt.small',   players: 5,   entry: '2 000',   pot: '10 000',    gains: '8 000',   comm: '2 000',  rate: '20%', color: '#00e676' },
  { key: 'hiw.mt.std',     players: 10,  entry: '2 000',   pot: '20 000',    gains: '18 000',  comm: '2 000',  rate: '10%', color: '#0097FC' },
  { key: 'hiw.mt.medium',  players: 20,  entry: '2 000',   pot: '40 000',    gains: '34 000',  comm: '6 000',  rate: '15%', color: '#ffd700' },
  { key: 'hiw.mt.big',     players: 50,  entry: '2 000',   pot: '100 000',   gains: '90 000',  comm: '10 000', rate: '10%', color: '#b06fff' },
  { key: 'hiw.mt.premium', players: 100, entry: '5 000',   pot: '500 000',   gains: '450 000', comm: '50 000', rate: '10%', color: '#ff9800' },
]

const LEAGUE_TIERS = [
  { emoji: '🥉', name: 'Bronze',  pts: '10 000',  color: '#cd7f32' },
  { emoji: '🥈', name: 'Argent',  pts: '25 000',  color: '#c0c0c0' },
  { emoji: '🥇', name: 'Or',      pts: '40 000',  color: '#ffd700' },
  { emoji: '💎', name: 'Diamant', pts: '60 000',  color: '#00c8ff' },
  { emoji: '⚡', name: 'Legend',  pts: '80 000',  color: '#b06fff' },
  { emoji: '🏆', name: 'Gloire',  pts: '100 000', color: '#ff4081' },
]

const KEY_POINT_META = [
  { icon: TrendingUp, color: '#00e676', key: 'hiw.s1.kp1' },
  { icon: Zap,        color: '#ffd700', key: 'hiw.s1.kp2' },
  { icon: Trophy,     color: '#00c8ff', key: 'hiw.s1.kp3' },
  { icon: Shield,     color: '#b06fff', key: 'hiw.s1.kp4' },
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

  const COL_HEADERS = [
    t('hiw.s1.col.type'), t('hiw.s1.col.players'), t('hiw.s1.col.entry'),
    t('hiw.s1.col.pot'), t('hiw.s1.col.gains'), t('hiw.s1.col.comm'), t('hiw.s1.col.rate'),
  ]

  const DIST_ITEMS = [
    { rankKey: 'hiw.dist.1st', val: '10 000 SKY', color: '#ffd700' },
    { rankKey: 'hiw.dist.2nd', val: '5 000 SKY',  color: '#c0c0c0' },
    { rankKey: 'hiw.dist.3rd', val: '3 000 SKY',  color: '#cd7f32' },
    { rankKey: 'hiw.dist.plat', val: '2 000 SKY', color: '#0097FC' },
  ]

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

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — FINANCIAL MODEL
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)}>
            <SectionTitle sub={t('hiw.s1.sub')}>{t('hiw.s1.title')}</SectionTitle>
          </motion.div>

          {/* Table */}
          <motion.div {...fadeUp(0.05)} className="overflow-x-auto rounded-2xl border dark:border-white/10 border-[#00165F]/10 mb-10">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="dark:bg-[#0d1124] bg-[#00165F]/5 text-left">
                  {COL_HEADERS.map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider dark:text-white/50 text-[#00165F]/50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATCH_META.map((row, i) => (
                  <tr key={row.key}
                    className={`border-t dark:border-white/5 border-[#00165F]/5 transition-colors dark:hover:bg-white/3 hover:bg-[#00165F]/3 ${i % 2 === 0 ? 'dark:bg-[#0a0f1e]/60' : 'dark:bg-[#0d1124]/40'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                        <span className="font-bold dark:text-white text-[#00165F]">{t(row.key)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 dark:text-white/70 text-[#00165F]/70 font-mono">{row.players}</td>
                    <td className="px-4 py-3 dark:text-white/70 text-[#00165F]/70 font-mono">{row.entry}</td>
                    <td className="px-4 py-3 dark:text-white/70 text-[#00165F]/70 font-mono">{row.pot}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#00e676' }}>{row.gains}</td>
                    <td className="px-4 py-3 font-mono dark:text-white/50 text-[#00165F]/50">{row.comm}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: `${row.color}18`, color: row.color }}>
                        {row.rate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Distribution example */}
          <motion.div {...fadeUp(0.08)}
            className="dark:bg-[#0d1124] bg-white rounded-2xl border dark:border-white/10 border-[#00165F]/10 p-6 mb-10"
          >
            <p className="text-xs font-black uppercase tracking-wider dark:text-white/40 text-[#00165F]/40 mb-4">
              {t('hiw.s1.dist.title')}
            </p>
            <div className="flex flex-wrap gap-3">
              {DIST_ITEMS.map((item) => (
                <div key={item.rankKey} className="flex-1 min-w-[120px] px-4 py-3 rounded-xl text-center"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                  <p className="text-lg font-black mb-0.5" style={{ color: item.color }}>{item.val}</p>
                  <p className="text-xs dark:text-white/50 text-[#00165F]/50">{t(item.rankKey)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Key points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KEY_POINT_META.map((pt, i) => {
              const Icon = pt.icon
              return (
                <motion.div key={i} {...fadeUp(0.05 * (i + 1))}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl dark:bg-[#0d1124] bg-white border dark:border-white/8 border-[#00165F]/8"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${pt.color}18` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: pt.color }} />
                  </div>
                  <p className="text-sm font-semibold dark:text-white/80 text-[#00165F]/80">{t(pt.key)}</p>
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
