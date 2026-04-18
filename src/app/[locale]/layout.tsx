import { NextIntlClientProvider, useMessages } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/lib/auth-context'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  setRequestLocale(params.locale)
  const messages = useMessages()

  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <AuthProvider>
            <main className="mx-auto max-w-lg min-h-screen safe-bottom">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
