'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, Wallet, Trophy, User, Menu, X, MessageCircle, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Container from '@/components/ui/Container'
import LanguageSwitch from '@/components/i18n/LanguageSwitch'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/lib/auth-store'
import { useTheme } from '@/components/providers/ThemeProvider'

const Navbar = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useI18n()
  const tokens = useAuthStore((s) => s.tokens)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useTheme()

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Gamepad2 },
    { href: '/challenges', label: t('nav.challenges'), icon: Trophy },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { href: '/chat', label: t('nav.chat'), icon: MessageCircle },
    { href: '/wallet', label: t('nav.wallet'), icon: Wallet },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b dark:border-white/10 border-[#00165F]/15 dark:bg-black/25 bg-white/90 backdrop-blur-md">
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
                      : 'dark:text-white/75 text-[#00165F]/75 dark:hover:text-secondary hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5 dark:hover:border-white/10 hover:border-[#00165F]/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors dark:text-white/60 dark:hover:text-white text-[#00165F]/70 hover:text-[#0097FC] hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <LanguageSwitch />
            {tokens ? (
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

          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors dark:text-white/60 dark:hover:text-white text-[#00165F]/70 hover:text-[#0097FC]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              className="dark:text-white/90 dark:hover:text-white text-[#00165F] hover:text-[#0097FC] transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 dark:bg-[#00165F] bg-white rounded-b-xl border-t dark:border-white/10 border-[#00165F]/15">
            <div className="px-4 pb-2 flex justify-between items-center">
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
                    'flex items-center space-x-2 px-4 py-3 rounded-md border border-transparent transition duration-200 mx-2',
                    isActive
                      ? 'text-secondary bg-secondary/10 border-secondary/20 shadow-glow-blue'
                      : 'dark:text-white/75 text-[#00165F]/75 hover:text-secondary dark:hover:bg-white/5 hover:bg-[#00165F]/5 dark:hover:border-white/10 hover:border-[#00165F]/10'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <div className="px-2 pt-2 space-y-2">
              {tokens ? (
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
          </div>
        )}
      </Container>
    </nav>
  )
}

export default Navbar
