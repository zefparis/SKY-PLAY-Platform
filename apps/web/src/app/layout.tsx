import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'

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
    <html lang="en">
      <body>
        <Navbar />
        <div className="pt-20">{children}</div>
      </body>
    </html>
  )
}
