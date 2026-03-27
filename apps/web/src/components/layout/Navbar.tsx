'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, Wallet, Trophy, User, Menu, X, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Container from '@/components/ui/Container'
import LanguageSwitch from '@/components/i18n/LanguageSwitch'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/features/auth/auth.store'

const Navbar = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useI18n()
  const status = useAuthStore((s) => s.status)
  const logout = useAuthStore((s) => s.logout)

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Gamepad2 },
    { href: '/challenges', label: t('nav.challenges'), icon: Trophy },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { href: '/chat', label: t('nav.chat'), icon: MessageCircle },
    { href: '/wallet', label: t('nav.wallet'), icon: Wallet },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/15 border border-secondary/30 shadow-glow-blue">
              <Gamepad2 className="w-6 h-6 text-secondary" />
            </span>
            <span className="text-xl sm:text-2xl font-extrabold title-tech text-gradient">
              SKY PLAY
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-md border border-transparent transition duration-200',
                    isActive
                      ? 'text-secondary bg-secondary/10 border-secondary/20 shadow-glow-blue'
                      : 'text-white/75 hover:text-secondary hover:bg-white/5 hover:border-white/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitch />
            {status === 'authenticated' ? (
              <>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.profile')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-white/90 hover:text-white transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <div className="px-4 pb-2">
              <LanguageSwitch className="w-full justify-center" />
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 rounded-md border border-transparent transition duration-200',
                    isActive
                      ? 'text-secondary bg-secondary/10 border-secondary/20 shadow-glow-blue'
                      : 'text-white/75 hover:text-secondary hover:bg-white/5 hover:border-white/10'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {status === 'authenticated' ? (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.profile')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
            )}
          </div>
        )}
      </Container>
    </nav>
  )
}

export default Navbar
