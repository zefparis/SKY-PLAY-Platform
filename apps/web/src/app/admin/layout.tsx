'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, AlertTriangle, Wallet, FileText, LogOut, Menu, X, ShieldAlert, Shield } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/challenges', label: 'Défis', icon: Trophy },
  { href: '/admin/disputes', label: 'Litiges', icon: AlertTriangle, badge: 'disputes' },
  { href: '/admin/exclusions', label: 'Exclusions', icon: Shield },
  { href: '/admin/security', label: 'Sécurité', icon: ShieldAlert, badge: 'security' },
  { href: '/admin/wallet', label: 'Wallet', icon: Wallet },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [disputeCount, setDisputeCount] = useState(0)
  const [securityCount, setSecurityCount] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [mounted, user, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const token = useAuthStore.getState().tokens?.idToken
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/challenges/disputes?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setDisputeCount(data?.length || 0))
        .catch(() => {})

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/security/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setSecurityCount((data?.multiAccountAlerts || 0) + (data?.flaggedDevices || 0)))
        .catch(() => {})
    }
  }, [user])

  if (!mounted || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff] dark:bg-[#030b1a]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#00165F] border-r border-white/10 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Dena, sans-serif' }}>
                SKY PLAY Admin
              </h1>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1">{user.username}</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition relative ${
                    isActive
                      ? 'bg-[#0097FC] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {item.badge === 'disputes' && disputeCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {disputeCount}
                    </span>
                  )}
                  {item.badge === 'security' && securityCount > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {securityCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => { logout(); router.push('/') }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#00165F]/80 backdrop-blur-md border-b dark:border-white/10 border-[#00165F]/10 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg dark:bg-white/10 bg-[#00165F]/10"
              >
                <Menu className="w-5 h-5 dark:text-white text-[#00165F]" />
              </button>
              <span className="lg:hidden text-sm font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>SKY PLAY Admin</span>
            </div>
            <div className="flex items-center gap-3">
              {securityCount > 0 && (
                <a href="/admin/security" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 transition animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {securityCount} alerte{securityCount > 1 ? 's' : ''}
                </a>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-black text-sm">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold dark:text-white text-[#00165F]">{user.username}</p>
                <p className="text-xs dark:text-white/40 text-[#00165F]/40">Administrateur</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
