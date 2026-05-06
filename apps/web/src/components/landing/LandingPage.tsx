'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy, Swords, Users, Crown, Zap, Star,
  Play, ArrowRight, ChevronRight, Gamepad2,
  UserPlus, Target, TrendingUp, Radio,
  Twitter, Instagram, Youtube, MessageCircle,
} from 'lucide-react'

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, delay, ease: 'easeOut' as const },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.7, delay },
})

// ─── Static data ──────────────────────────────────────────────────────────────
const GAMES = [
  { name: 'FIFA',           emoji: '⚽', color: '#00c8ff' },
  { name: 'eFootball',      emoji: '🏟️', color: '#00e676' },
  { name: 'Call of Duty',   emoji: '🎯', color: '#ff9800' },
  { name: 'Mortal Kombat',  emoji: '🐉', color: '#ff3d00' },
  { name: 'Street Fighter', emoji: '👊', color: '#f44336' },
  { name: 'Tekken',         emoji: '⚡', color: '#ffd700' },
]

const STEPS = [
  {
    n: '1',
    icon: UserPlus,
    title: 'Crée ton compte',
    desc: 'Inscription gratuite en 2 minutes',
    color: '#00c8ff',
  },
  {
    n: '2',
    icon: Target,
    title: 'Rejoins une compétition',
    desc: 'Choisis ton défi ou ton tournoi',
    color: '#ffd700',
  },
  {
    n: '3',
    icon: TrendingUp,
    title: 'Prouve ta valeur',
    desc: 'Grimpe dans les leagues et domine le classement',
    color: '#FD2E5F',
  },
]

const LEAGUES = [
  { emoji: '🥉', name: 'Bronze',  color: '#cd7f32' },
  { emoji: '🥈', name: 'Argent',  color: '#c0c0c0' },
  { emoji: '🥇', name: 'Or',      color: '#ffd700' },
  { emoji: '💎', name: 'Diamant', color: '#00c8ff' },
  { emoji: '⚡', name: 'Legend',  color: '#b06fff' },
  { emoji: '🏆', name: 'Gloire',  color: '#ff4081' },
]

const FORMATS = [
  { icon: Swords,  emoji: '⚔️', title: 'Duel 1v1',     desc: 'Face à face, le meilleur gagne',          color: '#00c8ff' },
  { icon: Users,   emoji: '👥', title: 'Challenge',    desc: 'Jusqu\'à 10 joueurs, classement final',    color: '#00e676' },
  { icon: Trophy,  emoji: '🏆', title: 'Tournoi',      desc: 'Phases de poules + élimination directe',  color: '#ffd700' },
  { icon: Crown,   emoji: '🏅', title: 'Championnat',  desc: 'Une saison entière, aller-retour',        color: '#FD2E5F' },
]

const STATS = [
  { icon: '🎮', value: '500+',   label: 'joueurs actifs' },
  { icon: '🏆', value: '1 200+', label: 'compétitions organisées' },
  { icon: '🌍', value: '5',      label: 'pays représentés' },
  { icon: '⚡', value: '7j/7',   label: 'tournois chaque semaine' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main data-page="landing" className="min-h-screen bg-[#0d0f1a] text-white overflow-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        {/* Background grid + glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,200,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[#00c8ff]/15 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#ffd700]/10 blur-[100px]" />
          <div className="absolute top-10 left-10 w-[300px] h-[300px] rounded-full bg-[#FD2E5F]/10 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-10">
          <Link href="/" className="block">
            <div className="font-black text-2xl uppercase tracking-[3px]" style={{ color: '#FD2E5F', fontFamily: "'Arial Black', sans-serif" }}>
              SKYPLAY
            </div>
            <div className="text-white/50 uppercase mt-0.5 tracking-[4px]" style={{ fontSize: '9px' }}>
              AFRICA
            </div>
          </Link>
        </div>

        {/* Top-right login link */}
        <div className="absolute top-6 right-6 md:right-8 z-10 hidden sm:block">
          <Link href="/login" className="text-sm text-white/70 hover:text-white transition">
            Se connecter
          </Link>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#00c8ff]/30 text-[#00c8ff] text-xs font-bold mb-7 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c8ff] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c8ff]" />
            </span>
            COMPÉTITIONS E-SPORT · CAMEROUN 🇨🇲
          </motion.div>

          <motion.h1 {...fadeUp(0.1)}
            className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
            La première plateforme de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] via-[#ffd700] to-[#FD2E5F]">
              compétitions e-sport
            </span>
            {' '}d&apos;Afrique centrale
          </motion.h1>

          <motion.p {...fadeUp(0.2)}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Défie les meilleurs joueurs, grimpe dans les classements,{' '}
            <span className="text-white font-semibold">deviens une légende.</span>
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0097FC] text-[#0d0f1a] font-black text-base shadow-[0_0_40px_rgba(0,200,255,0.4)] hover:shadow-[0_0_60px_rgba(0,200,255,0.6)] hover:scale-[1.03] transition-all min-w-[220px]">
              Rejoindre gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link href="/challenges"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 text-white font-bold text-base hover:bg-white/5 hover:border-white/40 transition min-w-[220px]">
              Voir les compétitions
            </Link>
          </motion.div>

          {/* Mock controllers / dashboard preview */}
          <motion.div {...fadeIn(0.5)} className="relative max-w-3xl mx-auto">
            <div className="relative aspect-[16/9] rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1d2e] to-[#0d0f1a] overflow-hidden shadow-[0_25px_80px_rgba(0,200,255,0.15)]">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              {/* Fake dashboard preview */}
              <div className="absolute inset-0 p-4 sm:p-6 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <div className="rounded-xl bg-[#00c8ff]/10 border border-[#00c8ff]/20 p-3 flex flex-col justify-between">
                    <Gamepad2 className="w-5 h-5 text-[#00c8ff]" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Défis actifs</p>
                      <p className="text-2xl font-black text-white">12</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/20 p-3 flex flex-col justify-between">
                    <Trophy className="w-5 h-5 text-[#ffd700]" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Tournois</p>
                      <p className="text-2xl font-black text-white">5</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FD2E5F]/10 border border-[#FD2E5F]/20 p-3 flex flex-col justify-between">
                    <Crown className="w-5 h-5 text-[#FD2E5F]" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Rang</p>
                      <p className="text-lg font-black text-white">💎 Diamant</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-xs text-white/60">FIFA · Tournoi en cours · 8 joueurs</span>
                  <Play className="w-4 h-4 text-white/40 ml-auto" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          GAMES SUPPORTED
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-[#00c8ff] text-xs font-bold uppercase tracking-[3px] mb-3">Jeux supportés</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Tes jeux favoris,<br className="md:hidden" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] to-[#ffd700]">
                en mode compétitif
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {GAMES.map((game, i) => (
              <motion.div key={game.name} {...fadeUp(i * 0.06)}
                className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center hover:border-white/30 hover:bg-white/[0.06] transition cursor-pointer overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{ background: `radial-gradient(circle at center, ${game.color}22, transparent 70%)` }} />
                <div className="relative">
                  <div className="text-4xl mb-3">{game.emoji}</div>
                  <p className="font-bold text-white text-sm mb-1">{game.name}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Compétitions disponibles</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <p className="text-[#ffd700] text-xs font-bold uppercase tracking-[3px] mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Simple. Rapide. <span className="text-[#00c8ff]">Compétitif.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-[68px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.n} {...fadeUp(i * 0.12)}
                  className="relative bg-[#13162a] border border-white/10 rounded-2xl p-7 text-center hover:border-white/20 transition group">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition" style={{ backgroundColor: step.color }} />
                    <div className="relative w-full h-full rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: step.color, backgroundColor: `${step.color}22` }}>
                      <Icon className="w-9 h-9" style={{ color: step.color }} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0d0f1a] border-2 flex items-center justify-center text-xs font-black"
                      style={{ borderColor: step.color, color: step.color }}>
                      {step.n}
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          LEAGUES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#ffd700]/5 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <p className="text-[#FD2E5F] text-xs font-bold uppercase tracking-[3px] mb-3">Système de progression</p>
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Un système de <span className="text-[#ffd700]">progression complet</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">Chaque victoire te rapproche du sommet</p>
          </motion.div>

          {/* Leagues progression */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-2 mb-10">
            {LEAGUES.map((tier, i) => (
              <motion.div key={tier.name} {...fadeUp(i * 0.08)} className="flex items-center">
                <div className="flex flex-col items-center group">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition" style={{ backgroundColor: tier.color }} />
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex items-center justify-center text-3xl md:text-4xl bg-[#13162a]"
                      style={{ borderColor: tier.color }}>
                      {tier.emoji}
                    </div>
                  </div>
                  <p className="mt-2 text-xs md:text-sm font-bold" style={{ color: tier.color }}>{tier.name}</p>
                </div>
                {i < LEAGUES.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-1 md:mx-2 text-white/20 hidden sm:block" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp(0.2)} className="text-center text-white/55 max-w-2xl mx-auto leading-relaxed">
            Accumule des <span className="text-[#00c8ff] font-semibold">SKY Points</span> à chaque victoire et monte de rang.
            Les meilleurs joueurs accèdent aux <span className="text-[#ffd700] font-semibold">compétitions exclusives</span>.
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          COMPETITION FORMATS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-[#00c8ff] text-xs font-bold uppercase tracking-[3px] mb-3">Formats disponibles</p>
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Des formats pour <span className="text-[#00c8ff]">tous les niveaux</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FORMATS.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} {...fadeUp(i * 0.08)}
                  className="group bg-[#13162a] border border-white/10 rounded-2xl p-6 hover:border-white/30 transition relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition blur-2xl" style={{ backgroundColor: f.color }} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${f.color}22`, border: `1px solid ${f.color}40` }}>
                        {f.emoji}
                      </div>
                      <Icon className="w-5 h-5 text-white/30 ml-auto" />
                    </div>
                    <h3 className="text-lg font-black mb-2" style={{ color: f.color }}>{f.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          LIVE & STREAMING
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-[#FD2E5F]/10 blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-black mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
              Regarde les matchs <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-[#FD2E5F]">en direct</span>
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Les joueurs streament leurs parties en direct sur la plateforme. Suis l&apos;action,
              encourage tes favoris et apprends des meilleurs.
            </p>
            <Link href="/live"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-bold hover:bg-red-500/25 transition">
              <Radio className="w-5 h-5" />
              Voir les matchs en cours
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="relative">
            <div className="relative aspect-video rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#1a1d2e] to-[#0d0f1a] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition cursor-pointer">
                  <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/90 text-white text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-xs text-white/70 bg-black/40 backdrop-blur-sm rounded-md px-2 py-1.5">
                FIFA · Finale tournoi · 1 247 spectateurs
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          COMMUNITY STATS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-[#ffd700] text-xs font-bold uppercase tracking-[3px] mb-3">Communauté</p>
            <h2 className="text-3xl md:text-5xl font-black">
              Rejoins la communauté <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] to-[#FD2E5F]">SKYPLAY AFRICA</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} {...fadeUp(i * 0.08)}
                className="bg-[#13162a] border border-white/10 rounded-2xl p-6 text-center hover:border-[#00c8ff]/30 transition">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] to-[#ffd700] mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00c8ff]/15 via-[#0d0f1a] to-[#FD2E5F]/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#00c8ff]/20 blur-[120px]" />
        </div>

        <motion.div {...fadeUp()} className="relative max-w-3xl mx-auto text-center">
          <Zap className="w-12 h-12 text-[#ffd700] mx-auto mb-5" />
          <h2 className="text-4xl md:text-6xl font-black mb-5 tracking-tight">
            Prêt à <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] to-[#ffd700]">dominer</span> ?
          </h2>
          <p className="text-lg text-white/70 mb-10">
            Rejoins SKYPLAY AFRICA et commence à compétir aujourd&apos;hui.
          </p>
          <Link href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0097FC] text-[#0d0f1a] font-black text-lg shadow-[0_0_60px_rgba(0,200,255,0.5)] hover:shadow-[0_0_80px_rgba(0,200,255,0.7)] hover:scale-[1.03] transition-all">
            Créer mon compte
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 bg-[#0a0c14] px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 mb-10">

            {/* Logo + tagline */}
            <div>
              <div className="font-black text-2xl uppercase tracking-[3px] mb-2" style={{ color: '#FD2E5F', fontFamily: "'Arial Black', sans-serif" }}>
                SKYPLAY
              </div>
              <div className="text-white/40 uppercase mb-4 tracking-[4px]" style={{ fontSize: '9px' }}>
                AFRICA
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Compétitions e-sport fondées sur l&apos;habileté.<br />
                Cameroun & Afrique centrale 🇨🇲
              </p>
            </div>

            {/* Nav links */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-[2px] font-bold mb-4">Navigation</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/" className="text-white/70 hover:text-[#00c8ff] transition">Accueil</Link></li>
                <li><Link href="/challenges" className="text-white/70 hover:text-[#00c8ff] transition">Défis</Link></li>
                <li><Link href="/how-it-works" className="text-white/70 hover:text-[#00c8ff] transition">Comment ça marche</Link></li>
                <li><Link href="/advertise" className="text-white/70 hover:text-[#00c8ff] transition">Annonceurs</Link></li>
                <li><Link href="/privacy" className="text-white/70 hover:text-[#00c8ff] transition">Confidentialité</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-[2px] font-bold mb-4">Suis-nous</p>
              <div className="flex gap-3 mb-5">
                {[
                  { Icon: Twitter,        href: 'https://twitter.com',  color: '#1DA1F2' },
                  { Icon: Instagram,      href: 'https://instagram.com', color: '#E4405F' },
                  { Icon: Youtube,        href: 'https://youtube.com',   color: '#FF0000' },
                  { Icon: MessageCircle,  href: 'https://discord.com',   color: '#5865F2' },
                ].map(({ Icon, href, color }, i) => (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition"
                    style={{ ['--hover' as any]: color }}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-white/40">
                Contact : <a href="mailto:contact@skyplays.tech" className="hover:text-white">contact@skyplays.tech</a>
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>© 2026 SKYPLAY AFRICA 🇨🇲 — Tous droits réservés</p>
            <p className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[#ffd700]" />
              Made with passion for African gamers
            </p>
          </div>
        </div>
      </footer>

    </main>
  )
}
