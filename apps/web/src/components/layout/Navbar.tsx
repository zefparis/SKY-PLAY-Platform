'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, Wallet, Trophy, User, X, MessageCircle, Moon, Sun, LogOut, Globe, Bell, LayoutDashboard, ChevronRight, ChevronDown, Pause, Shield, Lightbulb, Eye, Settings, Swords } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Container from '@/components/ui/Container'
import LanguageSwitch from '@/components/i18n/LanguageSwitch'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/lib/auth-store'
import { useTheme } from '@/components/providers/ThemeProvider'
import NotificationBell from '@/components/social/NotificationBell'
import FriendsList from '@/components/social/FriendsList'
import WalletBalance from '@/components/wallet/WalletBalance'

const Navbar = () => {
  const pathname = usePathname()
  const [superMenuOpen, setSuperMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const closeMega = useCallback(() => setMegaMenuOpen(false), [])

  useEffect(() => {
    if (!megaMenuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMega() }
    const onClick = (e: MouseEvent) => { if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) closeMega() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [megaMenuOpen, closeMega])
  const [exclusionStatus, setExclusionStatus] = useState<string>('ACTIVE')
  const [exclusionUntil, setExclusionUntil] = useState<string | null>(null)
  const { t } = useI18n()
  const tokens = useAuthStore((s) => s.tokens)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useTheme()
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (superMenuOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '' }, [superMenuOpen])

  useEffect(() => {
    if (!tokens?.idToken) return
    fetch(`${API}/users/self-exclude/status`, { headers: { Authorization: `Bearer ${tokens.idToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setExclusionStatus(data.exclusionStatus ?? 'ACTIVE')
          setExclusionUntil(data.exclusionUntil ?? null)
        }
      })
      .catch(() => {})
  }, [tokens?.idToken])

  const [hasLive, setHasLive] = useState(false)
  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await fetch(`${API}/challenges?status=IN_PROGRESS&limit=1`)
        if (res.ok) {
          const data = await res.json()
          setHasLive((data.challenges?.length ?? 0) > 0)
        }
      } catch {}
    }
    checkLive()
    const interval = setInterval(checkLive, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (pathname === '/') return null

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/challenges', label: t('nav.challenges'), icon: Swords },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { href: '/chat', label: t('nav.chat'), icon: MessageCircle },
    { href: '/wallet', label: 'Sky Credits', icon: Wallet },
  ]

  const megaLeft = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/challenges', label: 'Défis', icon: Swords },
    { href: '/live', label: 'Live', icon: Eye },
    { href: '/leaderboard', label: 'Classement', icon: Trophy },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/wallet', label: 'Sky Credits', icon: Wallet },
  ]

  const megaRight = [
    { href: '/how-it-works', label: 'Comment ça marche', icon: Lightbulb },
    { href: '/profile', label: 'Mon profil', icon: User },
    { href: '/challenges', label: 'Tournois', icon: Trophy },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile/responsabilite', label: 'Paramètres', icon: Settings },
  ]

  const bottomTabs = [
    { href: '/dashboard', label: 'Jeux',   icon: Gamepad2 },
    { href: '/challenges', label: 'Défis',  icon: Trophy },
    { href: '/chat',       label: 'Chat',   icon: MessageCircle },
    { href: '/wallet',     label: 'Sky Credits', icon: Wallet },
  ]

  return (
    <>
      {/* ═══ TOP NAVBAR ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b dark:border-white/10 border-[#00165F]/15 dark:bg-black/25 bg-white/90 backdrop-blur-md">
        <Container>
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center leading-none">
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
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Dashboard + Challenges */}
              {navLinks.slice(0, 2).map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md border border-transparent transition duration-200 text-sm',
                      isActive
                        ? 'text-secondary bg-secondary/10 border-secondary/20'
                        : 'dark:text-white/75 text-[#00165F]/75 dark:hover:text-secondary hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5'
                    )}>
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}

              {/* Live */}
              <Link href="/live"
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md border border-transparent transition duration-200 text-sm',
                  pathname === '/live'
                    ? 'text-secondary bg-secondary/10 border-secondary/20'
                    : 'dark:text-white/75 text-[#00165F]/75 dark:hover:text-secondary hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5'
                )}>
                <span className="relative flex h-2 w-2">
                  {hasLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${hasLive ? 'bg-[#FD2E5F]' : 'dark:bg-white/20 bg-[#00165F]/20'}`} />
                </span>
                <span>Live</span>
              </Link>

              {/* Plus mega menu */}
              <div ref={megaMenuRef} className="relative">
                <button
                  onClick={() => setMegaMenuOpen(v => !v)}
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md border border-transparent transition duration-200 text-sm',
                    megaMenuOpen
                      ? 'text-secondary bg-secondary/10 border-secondary/20'
                      : 'dark:text-white/75 text-[#00165F]/75 dark:hover:text-secondary hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5'
                  )}>
                  <span>Plus</span>
                  <motion.span animate={{ rotate: megaMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {megaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      onMouseLeave={closeMega}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-[#0d0f1a] border border-[#2a2d3e] rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 grid grid-cols-2 gap-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 pb-2">Navigation</p>
                          {megaLeft.map(item => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                              <Link key={item.href + item.label} href={item.href}
                                onClick={closeMega}
                                className={cn(
                                  'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition duration-150 group',
                                  isActive
                                    ? 'text-[#0097FC] bg-[#0097FC]/10'
                                    : 'text-white/70 hover:text-[#0097FC] hover:bg-white/5'
                                )}>
                                {item.href === '/live' ? (
                                  <span className="relative flex h-4 w-4 items-center justify-center">
                                    <Icon className="w-4 h-4" />
                                    {hasLive && <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FD2E5F]" /></span>}
                                  </span>
                                ) : (
                                  <Icon className="w-4 h-4" />
                                )}
                                <span>{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                        <div className="border-l border-[#2a2d3e] pl-3">
                          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 pb-2">Découvrir</p>
                          {megaRight.map(item => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                              <Link key={item.href + item.label} href={item.href}
                                onClick={closeMega}
                                className={cn(
                                  'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition duration-150',
                                  isActive
                                    ? 'text-[#0097FC] bg-[#0097FC]/10'
                                    : 'text-white/70 hover:text-[#0097FC] hover:bg-white/5'
                                )}>
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remaining priority links */}
              {navLinks.slice(2).map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md border border-transparent transition duration-200 text-sm',
                      isActive
                        ? 'text-secondary bg-secondary/10 border-secondary/20'
                        : 'dark:text-white/75 text-[#00165F]/75 dark:hover:text-secondary hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5'
                    )}>
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center space-x-4">
              {mounted && tokens && exclusionStatus === 'COOLING_OFF' && (
                <a href="/profile/responsabilite"
                  title={exclusionUntil ? `Pause jusqu'au ${new Date(exclusionUntil).toLocaleDateString('fr-FR')}` : 'Pause active'}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-400/15 border border-orange-400/30 text-orange-400 text-xs font-bold hover:bg-orange-400/20 transition">
                  <Pause className="w-3 h-3" /> Pause active
                </a>
              )}
              <NotificationBell />
              <FriendsList />
              <button onClick={toggleTheme} className="p-2 rounded-full transition-colors dark:text-white/60 dark:hover:text-white text-[#00165F]/70 hover:text-[#0097FC] hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle theme">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <LanguageSwitch />
              {mounted && tokens ? (
                <>
                  <Link href="/profile"><Button variant="outline" size="sm"><User className="w-4 h-4 mr-2" />{t('nav.profile')}</Button></Link>
                  <Button variant="outline" size="sm" onClick={() => logout()}>Logout</Button>
                </>
              ) : (
                <Link href="/login"><Button variant="outline" size="sm">Login</Button></Link>
              )}
            </div>

            {/* Mobile top-right: theme + language */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitch className="border-[#00165F]/15 dark:border-white/10 bg-[#00165F]/5 dark:bg-white/5" />
              <button onClick={toggleTheme} className="p-2 rounded-full transition-colors dark:text-white/60 text-[#00165F]/70 hover:text-[#0097FC]" aria-label="Toggle theme">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </Container>
      </nav>

      {/* ═══ MOBILE BOTTOM TAB BAR ════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] dark:bg-[#00165F]/95 bg-white/95 backdrop-blur-xl border-t dark:border-white/10 border-[#00165F]/10 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map(tab => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-[#0097FC] to-[#003399]"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#0097FC]' : 'dark:text-white/50 text-[#00165F]/40 group-hover:text-[#0097FC]'}`} />
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[#0097FC]' : 'dark:text-white/40 text-[#00165F]/40'}`}>{tab.label}</span>
              </Link>
            )
          })}

          {/* Plus tab */}
          <button
            onClick={() => setSuperMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group"
          >
            {mounted && user?.avatar ? (
              <img src={user.avatar} alt="" className="w-6 h-6 rounded-full ring-2 ring-[#0097FC]/40" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <span className="text-[10px] font-semibold dark:text-white/40 text-[#00165F]/40 group-hover:text-[#0097FC]">Plus</span>
          </button>
        </div>
      </div>

      {/* ═══ SUPER MENU SLIDE-UP ══════════════════════════════════ */}
      <AnimatePresence>
        {superMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuperMenuOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl dark:bg-[#030b1a] bg-white shadow-2xl overflow-hidden"
              style={{ maxHeight: '88dvh' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full dark:bg-white/20 bg-[#00165F]/15" />
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(88dvh - 24px)' }}>

                {/* User section */}
                {mounted && tokens && user ? (
                  <div className="px-5 py-4 flex items-center gap-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#0097FC]/30" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-xl">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black dark:text-white text-[#00165F] text-base truncate">{user.username}</p>
                      <p className="text-xs dark:text-white/40 text-[#00165F]/40 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setSuperMenuOpen(false)}
                      className="p-2 rounded-xl dark:bg-white/8 bg-[#00165F]/6 transition hover:bg-[#0097FC]/10">
                      <ChevronRight className="w-5 h-5 dark:text-white/50 text-[#00165F]/50" />
                    </Link>
                    <button
                      onClick={() => { logout(); setSuperMenuOpen(false) }}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 transition hover:bg-red-500/20"
                      title="Se déconnecter"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <Link href="/login" onClick={() => setSuperMenuOpen(false)}
                      className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#0097FC] to-[#003399] text-white font-bold text-center">
                      Se connecter
                    </Link>
                  </div>
                )}

                {/* Wallet widget */}
                {mounted && tokens && (
                  <div className="px-5 pb-3">
                    <WalletBalance />
                  </div>
                )}

                <div className="h-px dark:bg-white/8 bg-[#00165F]/8 mx-5" />

                {/* Social */}
                {mounted && tokens && (
                  <div className="px-5 py-3 flex items-center gap-3">
                    <NotificationBell />
                    <FriendsList />
                    <span className="text-xs dark:text-white/40 text-[#00165F]/40">Notifications & Amis</span>
                  </div>
                )}

                {/* Nav links */}
                <div className="px-3 py-2 space-y-0.5">
                  {[
                    { href: '/how-it-works', label: 'Comment ça marche', icon: Lightbulb },
                    { href: '/leaderboard', label: 'Classement', icon: Trophy },
                    { href: '/profile', label: 'Mon profil', icon: User },
                    { href: '/profile/responsabilite', label: 'Jeu responsable', icon: Shield },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.href} href={item.href}
                        onClick={() => setSuperMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl dark:hover:bg-white/8 hover:bg-[#00165F]/5 transition group">
                        <div className="w-9 h-9 rounded-xl dark:bg-white/8 bg-[#00165F]/6 flex items-center justify-center">
                          <Icon className="w-4.5 h-4.5 dark:text-white/60 text-[#00165F]/60 group-hover:text-[#0097FC]" />
                        </div>
                        <span className="text-sm font-semibold dark:text-white/80 text-[#00165F]/80">{item.label}</span>
                        <ChevronRight className="w-4 h-4 dark:text-white/20 text-[#00165F]/20 ml-auto" />
                      </Link>
                    )
                  })}
                  <Link href="/live" onClick={() => setSuperMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl dark:hover:bg-white/8 hover:bg-[#00165F]/5 transition group">
                    <div className="w-9 h-9 rounded-xl dark:bg-white/8 bg-[#00165F]/6 flex items-center justify-center relative">
                      <Eye className="w-4 h-4 dark:text-white/60 text-[#00165F]/60 group-hover:text-[#0097FC]" />
                      {hasLive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FD2E5F]" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold dark:text-white/80 text-[#00165F]/80">Live</span>
                    <ChevronRight className="w-4 h-4 dark:text-white/20 text-[#00165F]/20 ml-auto" />
                  </Link>
                </div>

                <div className="h-px dark:bg-white/8 bg-[#00165F]/8 mx-5 my-1" />

                {/* Settings */}
                <div className="px-3 py-2 space-y-0.5">
                  {/* Theme */}
                  <button onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl dark:hover:bg-white/8 hover:bg-[#00165F]/5 transition">
                    <div className="w-9 h-9 rounded-xl dark:bg-white/8 bg-[#00165F]/6 flex items-center justify-center">
                      {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-[#0097FC]" /> : <Sun className="w-4.5 h-4.5 text-[#0097FC]" />}
                    </div>
                    <span className="text-sm font-semibold dark:text-white/80 text-[#00165F]/80">
                      {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
                    </span>
                    <div className="ml-auto w-10 h-5 rounded-full bg-[#0097FC]/30 relative">
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#0097FC] transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>

                  {/* Language */}
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
                    <div className="w-9 h-9 rounded-xl dark:bg-white/8 bg-[#00165F]/6 flex items-center justify-center">
                      <Globe className="w-4.5 h-4.5 dark:text-white/60 text-[#00165F]/60" />
                    </div>
                    <span className="text-sm font-semibold dark:text-white/80 text-[#00165F]/80">Langue</span>
                    <div className="ml-auto"><LanguageSwitch /></div>
                  </div>
                </div>


              </div>

              {/* Close button */}
              <button
                onClick={() => setSuperMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full dark:bg-white/10 bg-[#00165F]/8"
              >
                <X className="w-4 h-4 dark:text-white/60 text-[#00165F]/60" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
