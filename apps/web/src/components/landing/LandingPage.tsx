'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuthStore } from '@/lib/auth-store'

type Lang = 'fr' | 'en'
type ViewMode = 'login' | 'signup'

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  fr: {
    nav: { login: 'Se connecter', signup: "S'inscrire" },
    hero: {
      badge: '🔥 +2 000 joueurs actifs au Cameroun',
      title: 'Défie.\nJoue.\nGagne.',
      subtitle: "La première plateforme de défis gaming avec mise en argent réel en Afrique centrale. Jouez à FIFA, COD, Free Fire et gagnez jusqu'à 450 000 CFA.",
      cta1: 'Commencer à jouer',
      cta2: 'Voir comment ça marche',
      float1: '🏆 +18 000 CFA gagnés',
      float1sub: 'Il y a 2 min',
      float2: '🎮 Défi en cours',
      float2sub: 'FIFA • 3 vs 3',
    },
    stats: [
      { value: '2 000+', label: 'Joueurs' },
      { value: '450 000 CFA', label: 'Gain max' },
      { value: '10 min', label: 'Temps moyen' },
      { value: '100%', label: 'Sécurisé' },
    ],
    how: {
      title: 'Comment ça marche ?',
      steps: [
        { icon: '🎮', title: 'Crée ton défi', desc: "Choisis ton jeu, définis la mise (dès 2 000 CFA) et lance ton défi. D'autres joueurs peuvent rejoindre." },
        { icon: '⚔️', title: 'Joue sur ta plateforme', desc: "Jouez normalement sur FIFA, COD, Free Fire ou tout autre jeu. SKY PLAY ne modifie pas votre jeu." },
        { icon: '💰', title: 'Récupère tes gains', desc: "Déclarez votre résultat, le gagnant est payé instantanément sur Mobile Money ou carte." },
      ],
      cta: 'Je veux gagner !',
    },
    games: {
      title: 'Jeux supportés',
      subtitle: 'Tous les jeux populaires en Afrique',
      note: '+ Tout autre jeu sur demande',
    },
    table: {
      title: 'Combien pouvez-vous gagner ?',
      subtitle: 'Basé sur notre modèle de commission transparent',
      note: "SKY PLAY prélève une commission uniquement sur les défis complétés. Aucun frais d'abonnement.",
      badge: 'MEILLEUR GAIN',
      cols: ['Type', 'Joueurs', 'Mise', 'Pot total', '1er gagne', 'Commission'],
      rows: [
        { type: 'Duel 1v1', players: '2', stake: '2 000 CFA', pot: '4 000 CFA', winner: '3 000 CFA', fee: '25%', highlight: false },
        { type: 'Petit challenge', players: '5', stake: '2 000 CFA', pot: '10 000 CFA', winner: '5 000 CFA', fee: '20%', highlight: false },
        { type: 'Challenge std', players: '10', stake: '2 000 CFA', pot: '20 000 CFA', winner: '9 000 CFA', fee: '10%', highlight: false },
        { type: 'Tournoi moyen', players: '20', stake: '2 000 CFA', pot: '40 000 CFA', winner: '17 000 CFA', fee: '15%', highlight: false },
        { type: 'Gros tournoi', players: '50', stake: '2 000 CFA', pot: '100 000 CFA', winner: '45 000 CFA', fee: '10%', highlight: false },
        { type: 'Tournoi premium', players: '100', stake: '5 000 CFA', pot: '500 000 CFA', winner: '225 000 CFA', fee: '10%', highlight: true },
      ],
    },
    footer: {
      tagline: 'La plateforme de défis gaming #1 en Afrique centrale',
      sections: [
        { title: 'Plateforme', links: [{ text: 'Défis', href: '/challenges' }, { text: 'Wallet', href: '/wallet' }, { text: 'Classement', href: '/leaderboard' }, { text: 'Chat', href: '/chat' }] },
        { title: 'Légal', links: [{ text: 'CGU', href: '#' }, { text: 'Politique de confidentialité', href: '#' }, { text: 'Jeu responsable', href: '#' }] },
        { title: 'Contact', links: [{ text: 'support@skyplay.cm', href: 'mailto:support@skyplay.cm' }, { text: 'Discord', href: '#' }, { text: 'Twitter / X', href: '#' }] },
      ],
      copyright: '© 2026 SKY PLAY — Tous droits réservés',
      disclaimer: 'SKY PLAY est une plateforme de divertissement. Jouez de manière responsable.',
    },
  },
  en: {
    nav: { login: 'Log in', signup: 'Sign up' },
    hero: {
      badge: '🔥 2,000+ active players in Cameroon',
      title: 'Challenge.\nPlay.\nWin.',
      subtitle: 'The first real-money gaming challenge platform in Central Africa. Play FIFA, COD, Free Fire and win up to 450,000 XAF.',
      cta1: 'Start Playing',
      cta2: 'See how it works',
      float1: '🏆 +18,000 XAF won',
      float1sub: '2 min ago',
      float2: '🎮 Challenge in progress',
      float2sub: 'FIFA • 3 vs 3',
    },
    stats: [
      { value: '2,000+', label: 'Players' },
      { value: '450K XAF', label: 'Max prize' },
      { value: '10 min', label: 'Avg time' },
      { value: '100%', label: 'Secure' },
    ],
    how: {
      title: 'How it works?',
      steps: [
        { icon: '🎮', title: 'Create your challenge', desc: "Choose your game, set your stake (from 2,000 XAF) and launch your challenge. Other players can join." },
        { icon: '⚔️', title: 'Play on your platform', desc: "Play normally on FIFA, COD, Free Fire or any game. SKY PLAY doesn't modify your game." },
        { icon: '💰', title: 'Collect your winnings', desc: "Submit your result, the winner gets paid instantly via Mobile Money or card." },
      ],
      cta: 'I want to win!',
    },
    games: {
      title: 'Supported Games',
      subtitle: 'All popular games in Africa',
      note: '+ Any other game on request',
    },
    table: {
      title: 'How much can you win?',
      subtitle: 'Based on our transparent commission model',
      note: 'SKY PLAY only takes a commission on completed challenges. No subscription fees.',
      badge: 'BEST PRIZE',
      cols: ['Type', 'Players', 'Stake', 'Total pot', '1st wins', 'Commission'],
      rows: [
        { type: '1v1 Duel', players: '2', stake: '2,000 XAF', pot: '4,000 XAF', winner: '3,000 XAF', fee: '25%', highlight: false },
        { type: 'Small challenge', players: '5', stake: '2,000 XAF', pot: '10,000 XAF', winner: '5,000 XAF', fee: '20%', highlight: false },
        { type: 'Std challenge', players: '10', stake: '2,000 XAF', pot: '20,000 XAF', winner: '9,000 XAF', fee: '10%', highlight: false },
        { type: 'Mid tournament', players: '20', stake: '2,000 XAF', pot: '40,000 XAF', winner: '17,000 XAF', fee: '15%', highlight: false },
        { type: 'Big tournament', players: '50', stake: '2,000 XAF', pot: '100,000 XAF', winner: '45,000 XAF', fee: '10%', highlight: false },
        { type: 'Premium tournament', players: '100', stake: '5,000 XAF', pot: '500,000 XAF', winner: '225,000 XAF', fee: '10%', highlight: true },
      ],
    },
    footer: {
      tagline: 'The #1 gaming challenge platform in Central Africa',
      sections: [
        { title: 'Platform', links: [{ text: 'Challenges', href: '/challenges' }, { text: 'Wallet', href: '/wallet' }, { text: 'Leaderboard', href: '/leaderboard' }, { text: 'Chat', href: '/chat' }] },
        { title: 'Legal', links: [{ text: 'Terms of Service', href: '#' }, { text: 'Privacy Policy', href: '#' }, { text: 'Responsible Gaming', href: '#' }] },
        { title: 'Contact', links: [{ text: 'support@skyplay.cm', href: 'mailto:support@skyplay.cm' }, { text: 'Discord', href: '#' }, { text: 'Twitter / X', href: '#' }] },
      ],
      copyright: '© 2026 SKY PLAY — All rights reserved',
      disclaimer: 'SKY PLAY is an entertainment platform. Play responsibly.',
    },
  },
}

type Trans = typeof translations.fr

// ─── Shared games list (visual only) ─────────────────────────────────────────
const GAMES = [
  { name: 'FIFA 25', emoji: '⚽', popular: true },
  { name: 'Call of Duty', emoji: '🎯', popular: false },
  { name: 'Free Fire', emoji: '🔥', popular: true },
  { name: 'PUBG Mobile', emoji: '🪖', popular: false },
  { name: 'Mobile Legends', emoji: '⚔️', popular: false },
  { name: 'Fortnite', emoji: '🏗️', popular: false },
  { name: 'Tekken', emoji: '👊', popular: false },
  { name: 'eFootball', emoji: '🥅', popular: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }} className={className}>
      {children}
    </motion.div>
  )
}

function StarField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 90 }, (_, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          width: `${(i % 3) + 1}px`,
          height: `${(i % 3) + 1}px`,
          borderRadius: '50%',
          background: 'white',
          animation: `sp-twinkle ${2 + (i % 3)}s ${(i % 5) * 0.7}s infinite ease-in-out`,
        }} />
      ))}
      <style>{`@keyframes sp-twinkle{0%,100%{opacity:.08;transform:scale(1)}50%{opacity:.85;transform:scale(1.9)}}`}</style>
    </div>
  )
}

// ─── Public Navbar ─────────────────────────────────────────────────────────────
function PublicNavbar({ lang, setLang, openLogin, openSignup, t }: {
  lang: Lang; setLang: (l: Lang) => void; openLogin: () => void; openSignup: () => void; t: Trans
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#00165F]/95 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/30' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <span className="text-xl font-black tracking-tight text-white sm:text-2xl">
          <span className="text-[#0097FC]">SKY</span> PLAY
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/15">
            <span>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            <span className="uppercase">{lang}</span>
            <span className="opacity-40 mx-0.5">|</span>
            <span className="opacity-60 uppercase">{lang === 'fr' ? 'en' : 'fr'}</span>
          </button>
          <button onClick={openLogin}
            className="hidden rounded-xl border border-white/25 bg-white/5 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 sm:block">
            {t.nav.login}
          </button>
          <button onClick={openSignup}
            className="rounded-xl bg-[#0097FC] px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-[#0097FC]/30 transition hover:brightness-110 active:scale-95">
            {t.nav.signup}
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ t, openSignup }: { t: Trans; openSignup: () => void }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-16"
      style={{ background: 'radial-gradient(ellipse 130% 90% at 50% 30%, #0055cc 0%, #00165F 45%, #000d3d 100%)' }}>
      <StarField />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
        {/* Text side */}
        <div className="max-w-xl text-center lg:text-left">
          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FD2E5F]/35 bg-[#FD2E5F]/12 px-4 py-2 text-sm font-semibold text-[#FD2E5F]">
            {t.hero.badge}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mb-6 whitespace-pre-line text-6xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {t.hero.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28 }}
            className="mb-10 text-lg leading-relaxed text-white/70 sm:text-xl">
            {t.hero.subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.42 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <button onClick={openSignup}
              className="rounded-2xl bg-[#0097FC] px-8 py-4 text-base font-extrabold text-white shadow-2xl shadow-[#0097FC]/40 transition hover:brightness-110 active:scale-[0.98]">
              {t.hero.cta1}
            </button>
            <a href="#how-it-works"
              className="rounded-2xl border border-white/25 bg-white/8 px-8 py-4 text-center text-base font-semibold text-white transition hover:bg-white/15">
              {t.hero.cta2}
            </a>
          </motion.div>
        </div>

        {/* Floating cards side */}
        <div className="relative hidden h-72 w-80 shrink-0 lg:block">
          <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-0 top-8 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-md">
            <p className="text-sm font-bold text-white">{t.hero.float1}</p>
            <p className="mt-0.5 text-xs text-white/55">{t.hero.float1sub}</p>
          </motion.div>
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
            className="absolute bottom-8 right-0 rounded-2xl border border-[#0097FC]/40 bg-[#0097FC]/18 px-5 py-4 shadow-2xl backdrop-blur-md">
            <p className="text-sm font-bold text-white">{t.hero.float2}</p>
            <p className="mt-0.5 text-xs text-[#0097FC]">{t.hero.float2sub}</p>
          </motion.div>
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#0097FC] text-center text-lg leading-8">⚽</div>
              <div>
                <div className="text-xs font-bold text-white">FIFA 25 — 1v1</div>
                <div className="text-[10px] text-white/50">Mise : 5 000 CFA</div>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-[#0097FC]" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-white/40"><span>En cours</span><span>67%</span></div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 mx-auto mb-8 w-full max-w-4xl px-4">
        <div className="grid grid-cols-2 divide-x divide-y divide-white/8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm sm:grid-cols-4 sm:divide-y-0">
          {t.stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center px-4 py-5">
              <span className="text-2xl font-black text-[#0097FC] sm:text-3xl">{s.value}</span>
              <span className="mt-1 text-xs font-medium text-white/50">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection({ t, openSignup }: { t: Trans; openSignup: () => void }) {
  return (
    <section id="how-it-works" className="bg-[#000d3d] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <FadeUp className="mb-16 text-center">
          <h2 className="text-4xl font-black text-white sm:text-5xl">{t.how.title}</h2>
        </FadeUp>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <FadeUp key={i} delay={i * 0.14}>
              <div className="group relative h-full rounded-3xl border border-white/10 bg-white/4 p-8 transition-all hover:border-[#0097FC]/50 hover:bg-white/8">
                {i < 2 && (
                  <span className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-2xl text-white/20 md:block">→</span>
                )}
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0097FC]/30 bg-[#0097FC]/12 text-3xl shadow-lg shadow-[#0097FC]/10 transition group-hover:shadow-[#0097FC]/25">
                  {step.icon}
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0097FC] text-xs font-black text-white">{i + 1}</span>
                  <h3 className="text-lg font-extrabold text-white">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-white/60">{step.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.48} className="mt-14 text-center">
          <button onClick={openSignup}
            className="rounded-2xl bg-gradient-to-r from-[#FD2E5F] to-rose-400 px-10 py-4 text-base font-extrabold text-white shadow-xl shadow-[#FD2E5F]/30 transition hover:brightness-110 active:scale-[0.98]">
            {t.how.cta}
          </button>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Games ────────────────────────────────────────────────────────────────────
function GamesSection({ t }: { t: Trans }) {
  return (
    <section className="bg-[#00165F] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <FadeUp className="mb-12 text-center">
          <h2 className="text-4xl font-black text-white sm:text-5xl">{t.games.title}</h2>
          <p className="mt-3 text-lg text-white/55">{t.games.subtitle}</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GAMES.map((game, i) => (
              <div key={i} className="group relative cursor-default rounded-2xl border border-[#0097FC]/20 bg-[#00165F]/80 p-6 text-center transition-all duration-200 hover:scale-105 hover:border-[#0097FC]/60 hover:bg-[#0097FC]/12 hover:shadow-xl hover:shadow-[#0097FC]/15">
                {game.popular && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-[#FD2E5F] px-2 py-0.5 text-[10px] font-black text-white shadow-lg">
                    POPULAIRE
                  </span>
                )}
                <div className="mb-3 text-4xl">{game.emoji}</div>
                <div className="text-sm font-bold text-white">{game.name}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm italic text-white/40">{t.games.note}</p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Pricing Table ────────────────────────────────────────────────────────────
function PricingSection({ t }: { t: Trans }) {
  return (
    <section className="bg-[#000d3d] py-24">
      <div className="mx-auto max-w-5xl px-4">
        <FadeUp className="mb-12 text-center">
          <h2 className="text-4xl font-black text-white sm:text-5xl">{t.table.title}</h2>
          <p className="mt-3 text-white/55">{t.table.subtitle}</p>
        </FadeUp>
        <FadeUp delay={0.1} className="space-y-2.5">
          <div className="hidden grid-cols-6 gap-4 px-5 md:grid">
            {t.table.cols.map((c, i) => (
              <span key={i} className={`text-xs font-bold uppercase tracking-[0.14em] ${i === 4 ? 'text-[#0097FC]' : 'text-white/35'}`}>{c}</span>
            ))}
          </div>
          {t.table.rows.map((row, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
              className={`relative grid grid-cols-2 items-center gap-x-4 gap-y-1 rounded-2xl border px-5 py-4 md:grid-cols-6 ${
                row.highlight
                  ? 'border-[#FD2E5F]/45 bg-[#FD2E5F]/8 shadow-lg shadow-[#FD2E5F]/8'
                  : 'border-white/8 bg-white/4 transition hover:border-white/18'
              }`}>
              {row.highlight && (
                <span className="absolute -top-2.5 right-5 rounded-full bg-[#FD2E5F] px-3 py-0.5 text-[10px] font-black text-white shadow-md">
                  {t.table.badge}
                </span>
              )}
              <span className="col-span-2 text-sm font-bold text-white md:col-span-1">{row.type}</span>
              <span className="text-sm text-white/55"><span className="text-[10px] text-white/35 md:hidden">👥 </span>{row.players}</span>
              <span className="text-sm text-white/55"><span className="text-[10px] text-white/35 md:hidden">💰 </span>{row.stake}</span>
              <span className="text-sm text-white/55">{row.pot}</span>
              <span className="text-base font-black text-[#0097FC]">{row.winner}</span>
              <span className="text-sm text-white/45">{row.fee}</span>
            </motion.div>
          ))}
          <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-5 py-4 text-center text-sm text-white/50">
            {t.table.note}
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection({ t }: { t: Trans }) {
  return (
    <footer className="border-t border-white/8 bg-[#000820] pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xl font-black text-white"><span className="text-[#0097FC]">SKY</span> PLAY</p>
            <p className="mt-3 text-sm leading-relaxed text-white/45">{t.footer.tagline}</p>
          </div>
          {t.footer.sections.map((sec, i) => (
            <div key={i}>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">{sec.title}</h4>
              <ul className="space-y-2.5">
                {sec.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="text-sm text-white/55 transition hover:text-white">{link.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-8 text-xs text-white/30 sm:flex-row">
          <span>{t.footer.copyright}</span>
          <span className="text-center">{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const tokens = useAuthStore((s) => s.tokens)
  const [lang, setLang] = useState<Lang>('fr')
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<ViewMode>('login')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && tokens) router.replace('/dashboard')
  }, [mounted, tokens, router])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('skyplay-lang') as Lang | null
      if (saved === 'fr' || saved === 'en') setLang(saved)
    } catch { /* noop */ }
  }, [])

  const changeLang = (l: Lang) => {
    setLang(l)
    try { localStorage.setItem('skyplay-lang', l) } catch { /* noop */ }
  }

  const openLogin = () => { setAuthView('login'); setAuthOpen(true) }
  const openSignup = () => { setAuthView('signup'); setAuthOpen(true) }

  const t = translations[lang]

  if (!mounted || tokens) return null

  return (
    <>
      <div data-page="landing" className="overflow-x-hidden bg-[#00165F] text-white">
        <PublicNavbar lang={lang} setLang={changeLang} openLogin={openLogin} openSignup={openSignup} t={t} />
        <HeroSection t={t} openSignup={openSignup} />
        <HowItWorksSection t={t} openSignup={openSignup} />
        <GamesSection t={t} />
        <PricingSection t={t} />
        <FooterSection t={t} />
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView={authView} />
    </>
  )
}
