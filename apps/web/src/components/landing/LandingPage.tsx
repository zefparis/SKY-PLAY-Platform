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
        { icon: '🎮', title: 'Achetez votre Pass de participation', desc: "Choisissez votre compétition et achetez votre pass d'accès. Votre paiement couvre l'organisation, l'animation et l'infrastructure de la compétition." },
        { icon: '⚔️', title: 'Jouez sur votre plateforme', desc: "Jouez normalement sur FIFA, COD, Free Fire ou tout autre jeu. SKY PLAY ne modifie pas votre jeu." },
        { icon: '🏆', title: 'Recevez votre prime de performance', desc: "Le vainqueur reçoit une prime de performance prédéfinie selon le règlement officiel de la compétition." },
      ],
      cta: 'Je veux participer !',
    },
    games: {
      title: 'Jeux supportés',
      subtitle: 'Tous les jeux populaires en Afrique',
      note: '+ Tout autre jeu sur demande',
    },
    table: {
      title: 'Dotations des compétitions',
      subtitle: 'Primes de performance prédéfinies par règlement officiel',
      note: "⚖️ Les primes sont prédéfinies et encadrées par un règlement officiel publié avant chaque compétition. SKY PLAY ENTERTAINMENT est une plateforme de compétitions e-sport fondées sur l'habileté.",
      badge: 'MEILLEURE PRIME',
      cols: ['Type', 'Joueurs', 'Pass', 'Dotation', 'Prime 1er', "Frais d'org."],
      rows: [
        { type: 'Duel 1v1', players: '2', stake: '2 000 CFA', pot: '4 000 CFA', winner: '3 000 CFA', fee: '25%', highlight: false },
        { type: 'Petit challenge', players: '5', stake: '2 000 CFA', pot: '10 000 CFA', winner: '5 000 CFA', fee: '20%', highlight: false },
        { type: 'Challenge std', players: '10', stake: '2 000 CFA', pot: '20 000 CFA', winner: '9 000 CFA', fee: '10%', highlight: false },
        { type: 'Tournoi moyen', players: '20', stake: '2 000 CFA', pot: '40 000 CFA', winner: '17 000 CFA', fee: '15%', highlight: false },
        { type: 'Gros tournoi', players: '50', stake: '2 000 CFA', pot: '100 000 CFA', winner: '45 000 CFA', fee: '10%', highlight: false },
        { type: 'Tournoi premium', players: '100', stake: '5 000 CFA', pot: '500 000 CFA', winner: '225 000 CFA', fee: '10%', highlight: true },
      ],
    },
    apk: {
      title: "Télécharge l'app SKY PLAY",
      subtitle: 'Disponible sur Android — Installation directe',
      button: '📱 Télécharger l\'APK Android',
      note: "⚠️ Activez 'Sources inconnues' dans Paramètres → Sécurité pour installer",
      size: '~15 MB',
      version: 'v1.0.0',
      navButton: '📱 App Android',
    },
    footer: {
      tagline: 'La plateforme de défis gaming #1 en Afrique centrale',
      legal: 'SKY PLAY ENTERTAINMENT — Plateforme de compétitions e-sport et de divertissement numérique fondées sur l\'habileté.',
      sections: [
        { title: 'Plateforme', links: [{ text: 'Compétitions', href: '/challenges' }, { text: 'Sky Credits', href: '/wallet' }, { text: 'Classement', href: '/leaderboard' }, { text: 'Chat', href: '/chat' }] },
        { title: 'Légal', links: [{ text: 'CGU', href: '/cgu' }, { text: 'Politique de confidentialité', href: '/politique-confidentialite' }, { text: 'Jeu responsable', href: '/jeu-responsable' }] },
        { title: 'Contact', links: [{ text: 'support@skyplay.cm', href: 'mailto:support@skyplay.cm' }, { text: 'Discord', href: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay' }, { text: 'Twitter / X', href: '#' }] },
      ],
      copyright: '© 2026 SKY PLAY ENTERTAINMENT — Tous droits réservés',
      disclaimer: 'Compétitions fondées sur l\'habileté. Jouez de manière responsable.',
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
        { icon: '🎮', title: 'Buy your participation Pass', desc: "Choose your competition and buy your access pass. Your payment covers the organization, animation and infrastructure of the competition." },
        { icon: '⚔️', title: 'Play on your platform', desc: "Play normally on FIFA, COD, Free Fire or any game. SKY PLAY doesn't modify your game." },
        { icon: '🏆', title: 'Receive your performance reward', desc: "The winner receives a predefined performance reward according to the official competition rules." },
      ],
      cta: 'I want to compete!',
    },
    games: {
      title: 'Supported Games',
      subtitle: 'All popular games in Africa',
      note: '+ Any other game on request',
    },
    table: {
      title: 'Competition Prize Pools',
      subtitle: 'Performance rewards predefined by official rules',
      note: '⚖️ Prizes are predefined and governed by official rules published before each competition. SKY PLAY ENTERTAINMENT is a skill-based e-sport competition platform.',
      badge: 'BEST REWARD',
      cols: ['Type', 'Players', 'Pass', 'Prize Pool', '1st Prize', 'Org. Fee'],
      rows: [
        { type: '1v1 Duel', players: '2', stake: '2,000 XAF', pot: '4,000 XAF', winner: '3,000 XAF', fee: '25%', highlight: false },
        { type: 'Small challenge', players: '5', stake: '2,000 XAF', pot: '10,000 XAF', winner: '5,000 XAF', fee: '20%', highlight: false },
        { type: 'Std challenge', players: '10', stake: '2,000 XAF', pot: '20,000 XAF', winner: '9,000 XAF', fee: '10%', highlight: false },
        { type: 'Mid tournament', players: '20', stake: '2,000 XAF', pot: '40,000 XAF', winner: '17,000 XAF', fee: '15%', highlight: false },
        { type: 'Big tournament', players: '50', stake: '2,000 XAF', pot: '100,000 XAF', winner: '45,000 XAF', fee: '10%', highlight: false },
        { type: 'Premium tournament', players: '100', stake: '5,000 XAF', pot: '500,000 XAF', winner: '225,000 XAF', fee: '10%', highlight: true },
      ],
    },
    apk: {
      title: 'Download SKY PLAY App',
      subtitle: 'Available on Android — Direct install',
      button: '📱 Download Android APK',
      note: "⚠️ Enable 'Unknown sources' in Settings → Security to install",
      size: '~15 MB',
      version: 'v1.0.0',
      navButton: '📱 Android App',
    },
    footer: {
      tagline: 'The #1 gaming challenge platform in Central Africa',
      legal: 'SKY PLAY ENTERTAINMENT — Skill-based e-sport competition and digital entertainment platform.',
      sections: [
        { title: 'Platform', links: [{ text: 'Competitions', href: '/challenges' }, { text: 'Sky Credits', href: '/wallet' }, { text: 'Leaderboard', href: '/leaderboard' }, { text: 'Chat', href: '/chat' }] },
        { title: 'Legal', links: [{ text: 'Terms of Service', href: '/cgu' }, { text: 'Privacy Policy', href: '/politique-confidentialite' }, { text: 'Responsible Gaming', href: '/jeu-responsable' }] },
        { title: 'Contact', links: [{ text: 'support@skyplay.cm', href: 'mailto:support@skyplay.cm' }, { text: 'Discord', href: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay' }, { text: 'Twitter / X', href: '#' }] },
      ],
      copyright: '© 2026 SKY PLAY ENTERTAINMENT — All rights reserved',
      disclaimer: 'Skill-based competitions. Play responsibly.',
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
        <div className="leading-none">
          <div className="font-black text-xl uppercase tracking-widest"
            style={{ color: '#FD2E5F', fontFamily: "'Arial Black', sans-serif", letterSpacing: '3px' }}>
            SKY PLAY
          </div>
          <div className="text-white/70 uppercase mt-0.5"
            style={{ fontSize: '9px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '4px' }}>
            ENTERTAINMENT
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/15">
            <span>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            <span className="uppercase">{lang}</span>
            <span className="opacity-40 mx-0.5">|</span>
            <span className="opacity-60 uppercase">{lang === 'fr' ? 'en' : 'fr'}</span>
          </button>
          <a href="#download"
            className="hidden rounded-xl border border-[#3DDC84]/40 bg-[#3DDC84]/8 px-3 py-1.5 text-xs font-bold text-[#3DDC84] transition hover:bg-[#3DDC84]/15 sm:block">
            {t.apk.navButton}
          </a>
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
                <div className="text-[10px] text-white/50">Pass : 5 000 CFA</div>
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

// ─── APK Download ────────────────────────────────────────────────────────────
function ApkDownloadSection({ t }: { t: Trans }) {
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || '#'

  return (
    <section id="download" className="border-t border-white/8 py-24"
      style={{ background: 'linear-gradient(160deg, #00165F 0%, #000d3d 60%, #000820 100%)' }}>
      <div className="mx-auto max-w-4xl px-4 text-center">
        <FadeUp>
          {/* Android robot icon */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[#3DDC84]/30 bg-[#3DDC84]/10 shadow-2xl shadow-[#3DDC84]/20">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M6 18 L6 36 Q6 40 10 40 L38 40 Q42 40 42 36 L42 18 Q42 14 38 14 L10 14 Q6 14 6 18Z" fill="#3DDC84"/>
                <circle cx="17" cy="27" r="3" fill="#00165F"/>
                <circle cx="31" cy="27" r="3" fill="#00165F"/>
                <path d="M15 14 L10 6" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M33 14 L38 6" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="10" cy="5" r="2" fill="#3DDC84"/>
                <circle cx="38" cy="5" r="2" fill="#3DDC84"/>
                <rect x="2" y="20" width="4" height="12" rx="2" fill="#3DDC84"/>
                <rect x="42" y="20" width="4" height="12" rx="2" fill="#3DDC84"/>
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-4xl font-black text-white sm:text-5xl">{t.apk.title}</h2>
          <p className="mb-10 text-lg text-white/60">{t.apk.subtitle}</p>

          <a
            href={apkUrl}
            download="skyplay.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl bg-[#3DDC84] px-10 py-5 text-lg font-extrabold text-black shadow-2xl shadow-[#3DDC84]/30 transition hover:brightness-110 active:scale-[0.98]"
          >
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
              <path d="M6 18 L6 36 Q6 40 10 40 L38 40 Q42 40 42 36 L42 18 Q42 14 38 14 L10 14 Q6 14 6 18Z" fill="black" opacity="0.75"/>
              <circle cx="17" cy="27" r="3" fill="#3DDC84"/>
              <circle cx="31" cy="27" r="3" fill="#3DDC84"/>
            </svg>
            {t.apk.button}
          </a>

          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-white/40">
            <span>📦 {t.apk.size}</span>
            <span>🏷️ {t.apk.version}</span>
          </div>

          <p className="mx-auto mt-8 max-w-lg rounded-2xl border border-yellow-500/25 bg-yellow-500/8 px-6 py-4 text-sm text-yellow-300/80">
            {t.apk.note}
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Discord Widget ──────────────────────────────────────────────────────────
function DiscordWidget() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || ''
  
  if (!guildId) return null

  return (
    <section className="border-t border-white/8 bg-[#000820] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <FadeUp>
          <h2 className="mb-3 text-center text-3xl font-black text-white sm:text-4xl">
            Rejoins notre communauté <span className="text-[#5865F2]">Discord</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-base leading-relaxed text-white/55">
            Connecte-toi avec d'autres joueurs, participe aux discussions et reste informé des dernières nouveautés.
          </p>
          <div className="hidden justify-center md:flex">
            <iframe
              src={`https://discord.com/widget?id=${guildId}&theme=dark`}
              width="350"
              height="500"
              allowTransparency={true}
              frameBorder={0}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              className="rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>
          <div className="flex justify-center md:hidden">
            <a
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/skyplay'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-[#5865F2] px-6 py-3 font-bold text-white shadow-lg shadow-[#5865F2]/30 transition hover:brightness-110"
            >
              <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
              </svg>
              Rejoindre le Discord
            </a>
          </div>
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
        <div className="border-t border-white/8 pt-8 space-y-3">
          <p className="text-xs text-white/40 text-center">{t.footer.legal}</p>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/30 sm:flex-row">
            <span>{t.footer.copyright}</span>
            <span className="text-center">{t.footer.disclaimer}</span>
          </div>
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
        <ApkDownloadSection t={t} />
        <DiscordWidget />
        <FooterSection t={t} />
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView={authView} />
    </>
  )
}
