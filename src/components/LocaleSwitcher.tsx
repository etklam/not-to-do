'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export default function LocaleSwitcher() {
  const t = useTranslations('locale')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggle = () => {
    const next = locale === 'zh-HK' ? 'en' : 'zh-HK'
    router.replace(pathname, { locale: next })
  }

  return (
    <button
      onClick={toggle}
      className="rounded-pill bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-bold text-kawaii-purple border border-kawaii-purple-light/30 hover:bg-kawaii-blush transition-all active:scale-95"
    >
      {t('switch')}
    </button>
  )
}
