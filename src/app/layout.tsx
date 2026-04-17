import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Not-To-Do | 不做清單',
  description: '追蹤你唔想做嘅嘢，每日忍住就係勝利 ✨',
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
  return children
}
