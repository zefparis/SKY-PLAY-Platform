import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import SessionRestorer from '@/components/providers/SessionRestorer'

export const metadata: Metadata = {
  title: 'SKY PLAY — Défie. Joue. Gagne. | Plateforme gaming Afrique',
  description: "Première plateforme de défis gaming avec mise en argent réel en Afrique centrale. FIFA, COD, Free Fire. Gagnez jusqu'\u00e0 450\u00a0000 CFA.",
  keywords: 'gaming, défis, argent, Cameroun, Mobile Money, FIFA, COD, Free Fire, SKY PLAY',
  openGraph: {
    title: 'SKY PLAY — Défie. Joue. Gagne.',
    description: "Gagnez jusqu'\u00e0 450\u00a0000 CFA en jouant \u00e0 vos jeux préférés.",
    url: 'https://sky-play-platform.vercel.app',
    siteName: 'SKY PLAY',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SKY PLAY" />
        <meta name="theme-color" content="#0097FC" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('skyplay-theme');
                if (t === 'light') document.documentElement.classList.remove('dark');
                else document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="dark:bg-[#00165F] bg-[#f0f4ff] dark:text-white text-[#00165F] min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <I18nProvider>
            <SessionRestorer />
            <Navbar />
            <div className="[&:has([data-page=landing])]:p-0 pt-20 pb-16 md:pb-0">{children}</div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
