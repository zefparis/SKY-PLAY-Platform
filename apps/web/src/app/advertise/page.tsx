'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Users, Globe, Smartphone, Trophy, Video, ImageIcon, Layout, Star, Mail, MessageCircle, Send, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const AUDIENCE = [
  { icon: '🎮', label: 'Gamers 15–35 ans', desc: 'Audience jeune et engagée' },
  { icon: '🌍', label: 'Afrique centrale', desc: 'Cameroun, Congo, RDC, Gabon…' },
  { icon: '📱', label: 'Mobile-first', desc: '85 % des sessions sur mobile' },
  { icon: '🏆', label: 'Passionnés de compétition', desc: 'Joueurs actifs, transactions régulières' },
]

const FORMATS = [
  {
    icon: Video,
    color: '#FD2E5F',
    title: 'Vidéo pré-session',
    desc: 'Spot de 10–30 s affiché avant chaque défi',
    specs: 'Format : MP4 · max 30 s · 1080p recommandé',
  },
  {
    icon: ImageIcon,
    color: '#0097FC',
    title: 'Bannière 728×90',
    desc: 'Affichée sur toutes les pages de la plateforme',
    specs: 'Format : JPG / PNG / GIF animé',
  },
  {
    icon: Layout,
    color: '#7c3aed',
    title: 'Overlay 300×250',
    desc: 'Pop-up discret, fermable après 5 s',
    specs: 'Format : JPG / PNG · fond transparent accepté',
  },
  {
    icon: Star,
    color: '#f59e0b',
    title: 'Événement sponsorisé',
    desc: 'Votre marque associée à un tournoi SKYPLAY AFRICA',
    specs: 'Format : sur mesure · branding complet',
  },
]

type FormState = {
  name: string
  email: string
  type: string
  message: string
}

export default function AdvertisePage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', type: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`[SKYPLAY AFRICA Ads] ${form.type || 'Demande'} — ${form.name}`)
    const body = encodeURIComponent(
      `Nom : ${form.name}\nEmail : ${form.email}\nFormat souhaité : ${form.type}\n\n${form.message}`
    )
    window.location.href = `mailto:ads@skyplays.tech?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <main className="min-h-screen dark:bg-[#00165F] bg-[#f0f4ff]">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#0097FC]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#FD2E5F]/10 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0097FC]/15 border border-[#0097FC]/30 text-[#0097FC] text-sm font-semibold mb-6">
            <Megaphone className="w-4 h-4" />
            Partenariats publicitaires
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-black dark:text-white text-[#00165F] leading-tight mb-5">
            Faites la publicité de votre marque sur{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0097FC] to-[#FD2E5F]">SKYPLAY AFRICA</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg dark:text-white/60 text-[#00165F]/60 mb-8">
            Touchez des milliers de gamers en Afrique centrale — une audience jeune, engagée et mobile-first.
          </motion.p>
          <motion.a {...fadeUp(0.3)}
            href="mailto:ads@skyplays.tech?subject=Demande%20publicité%20SKY%20PLAY"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0097FC] to-[#003399] text-white font-bold text-base shadow-lg hover:opacity-90 transition">
            <Mail className="w-5 h-5" />
            Nous contacter
            <ChevronRight className="w-4 h-4" />
          </motion.a>
        </div>
      </section>

      {/* ── AUDIENCE ──────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeUp()} className="text-2xl font-black dark:text-white text-[#00165F] text-center mb-10">
            Notre audience
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AUDIENCE.map((item, i) => (
              <motion.div key={item.label} {...fadeUp(i * 0.08)}
                className="dark:bg-white/5 bg-white/80 border dark:border-white/10 border-[#00165F]/10 rounded-2xl p-5 text-center hover:border-[#0097FC]/40 transition">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="font-bold dark:text-white text-[#00165F] text-sm mb-1">{item.label}</p>
                <p className="text-xs dark:text-white/40 text-[#00165F]/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATS ───────────────────────────────────────────── */}
      <section className="py-16 px-4 dark:bg-white/[0.02] bg-white/50">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeUp()} className="text-2xl font-black dark:text-white text-[#00165F] text-center mb-2">
            Formats disponibles
          </motion.h2>
          <motion.p {...fadeUp(0.05)} className="text-center dark:text-white/50 text-[#00165F]/50 text-sm mb-10">
            Des emplacements stratégiques à chaque étape du parcours joueur
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FORMATS.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} {...fadeUp(i * 0.08)}
                  className="dark:bg-[#0d0f1a] bg-white border dark:border-white/10 border-[#00165F]/10 rounded-2xl p-6 hover:border-opacity-50 transition group"
                  style={{ '--hover-color': f.color } as React.CSSProperties}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${f.color}18` }}>
                      <Icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-white text-[#00165F] mb-1">{f.title}</h3>
                      <p className="text-sm dark:text-white/60 text-[#00165F]/60 mb-2">{f.desc}</p>
                      <p className="text-xs font-mono dark:text-white/30 text-[#00165F]/40 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md inline-block">
                        {f.specs}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TARIFS ────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp()}
            className="dark:bg-gradient-to-br dark:from-[#0d0f1a] dark:to-[#0d1a2a] bg-white border dark:border-[#0097FC]/20 border-[#0097FC]/30 rounded-2xl p-10">
            <Trophy className="w-10 h-10 text-[#f59e0b] mx-auto mb-4" />
            <h2 className="text-2xl font-black dark:text-white text-[#00165F] mb-3">Tarification sur devis</h2>
            <p className="dark:text-white/60 text-[#00165F]/60 mb-6">
              Chaque campagne est unique. Contactez-nous pour un devis personnalisé adapté à votre budget et vos objectifs.
            </p>
            <a href="mailto:ads@skyplays.tech?subject=Demande%20de%20devis%20publicitaire"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0097FC]/15 border border-[#0097FC]/30 text-[#0097FC] font-semibold hover:bg-[#0097FC]/25 transition text-sm">
              <Mail className="w-4 h-4" />
              Demander un devis gratuit
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT FORM ──────────────────────────────────────── */}
      <section className="py-16 px-4 dark:bg-white/[0.02] bg-white/50">
        <div className="max-w-xl mx-auto">
          <motion.h2 {...fadeUp()} className="text-2xl font-black dark:text-white text-[#00165F] text-center mb-2">
            Contactez-nous
          </motion.h2>
          <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-6 mb-8 text-sm">
            <a href="mailto:ads@skyplays.tech"
              className="flex items-center gap-2 dark:text-white/50 text-[#00165F]/60 hover:text-[#0097FC] transition">
              <Mail className="w-4 h-4" /> ads@skyplays.tech
            </a>
            <a href="https://wa.me/237650000000"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 dark:text-white/50 text-[#00165F]/60 hover:text-[#25D366] transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </motion.div>

          <motion.form {...fadeUp(0.1)} onSubmit={handleSubmit}
            className="dark:bg-[#0d0f1a] bg-white border dark:border-white/10 border-[#00165F]/10 rounded-2xl p-7 space-y-4">

            {sent && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <Send className="w-4 h-4 shrink-0" />
                Votre messagerie s&apos;est ouverte. Envoyez l&apos;email pour finaliser !
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 mb-1.5 uppercase tracking-wide">
                  Nom / Entreprise *
                </label>
                <input
                  name="name" required value={form.name} onChange={handleChange}
                  placeholder="SKYPLAY AFRICA Corp."
                  className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/15 dark:text-white text-[#00165F] text-sm placeholder:text-white/20 focus:outline-none focus:border-[#0097FC]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 mb-1.5 uppercase tracking-wide">
                  Email *
                </label>
                <input
                  name="email" type="email" required value={form.email} onChange={handleChange}
                  placeholder="contact@marque.com"
                  className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/15 dark:text-white text-[#00165F] text-sm placeholder:text-white/20 focus:outline-none focus:border-[#0097FC]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 mb-1.5 uppercase tracking-wide">
                Format souhaité
              </label>
              <select
                name="type" value={form.type} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/15 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC]/50 transition">
                <option value="">Choisir un format…</option>
                <option value="Vidéo pré-session">Vidéo pré-session</option>
                <option value="Bannière 728×90">Bannière 728×90</option>
                <option value="Overlay 300×250">Overlay 300×250</option>
                <option value="Événement sponsorisé">Événement sponsorisé</option>
                <option value="Autre / Sur devis">Autre / Sur devis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-[#00165F]/50 mb-1.5 uppercase tracking-wide">
                Message
              </label>
              <textarea
                name="message" value={form.message} onChange={handleChange} rows={4}
                placeholder="Décrivez votre campagne, budget approximatif, durée souhaitée…"
                className="w-full px-4 py-2.5 rounded-xl dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/15 dark:text-white text-[#00165F] text-sm placeholder:text-white/20 focus:outline-none focus:border-[#0097FC]/50 transition resize-none"
              />
            </div>

            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0097FC] to-[#003399] text-white font-bold hover:opacity-90 transition text-sm">
              <Send className="w-4 h-4" />
              Envoyer la demande
            </button>
          </motion.form>
        </div>
      </section>

      {/* ── FOOTER MINI ───────────────────────────────────────── */}
      <section className="py-8 px-4 text-center">
        <p className="text-xs dark:text-white/30 text-[#00165F]/40">
          SKYPLAY AFRICA ·{' '}
          <Link href="/privacy" className="hover:text-[#0097FC] transition">Politique de confidentialité</Link>
          {' '}·{' '}
          <Link href="/terms" className="hover:text-[#0097FC] transition">CGU</Link>
        </p>
      </section>

    </main>
  )
}
