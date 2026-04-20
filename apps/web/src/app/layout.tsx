import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import AdBanner from '@/components/ads/AdBanner'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import SessionRestorer from '@/components/providers/SessionRestorer'

export const metadata: Metadata = {
  title: 'SKY PLAY ENTERTAINMENT — Compétitions e-sport fondées sur l\'habileté | Cameroun',
  description: "SKY PLAY ENTERTAINMENT — Plateforme de compétitions e-sport fondées sur l'habileté au Cameroun. Accédez à des duels, ligues et tournois via des pass de participation. FIFA, COD, Free Fire.",
  keywords: 'e-sport, compétitions, habileté, Cameroun, Mobile Money, FIFA, COD, Free Fire, SKY PLAY, tournoi, pass de participation',
  openGraph: {
    title: 'SKY PLAY ENTERTAINMENT — Compétitions e-sport | Cameroun',
    description: "Compétitions e-sport fondées sur l'habileté au Cameroun. Pass de participation dès 2 000 CFA.",
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
            <div className="pt-20 pb-1 px-4">
              <AdBanner />
            </div>
            <div className="[&:has([data-page=landing])]:p-0 pb-16 md:pb-0">{children}</div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
