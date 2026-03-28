import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'SKY PLAY - Competitive Gaming Platform',
  description: 'Join challenges, compete with players, and win prizes on the ultimate gaming platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
            <Navbar />
            <div className="pt-20">{children}</div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
