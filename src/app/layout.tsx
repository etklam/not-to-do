import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Not-To-Do | 不做清單',
  description: '追蹤你不想做的事，每天抵抗就是勝利 ✨',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Not-To-Do',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFFBF5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <main className="mx-auto max-w-lg min-h-screen safe-bottom">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
