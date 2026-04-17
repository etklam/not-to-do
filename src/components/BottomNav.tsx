'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: '今日',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B9D' : '#8B839C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    href: '/items',
    label: '清單',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#C084FC' : '#8B839C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/items/new',
    label: '新增',
    icon: (active: boolean) => (
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center -mt-4',
        'shadow-kawaii transition-all duration-200',
        active
          ? 'bg-gradient-to-br from-kawaii-pink to-kawaii-purple'
          : 'bg-gradient-to-br from-kawaii-pink to-kawaii-purple opacity-80'
      )}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-lg">
        <div className="mx-3 mb-3 bg-white/80 backdrop-blur-xl rounded-kawaii-lg shadow-kawaii-card border border-white/50">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-1.5 rounded-kawaii-sm',
                    'transition-all duration-200',
                    isActive ? 'text-kawaii-pink' : 'text-kawaii-text-light',
                    item.label === '新增' && 'px-2'
                  )}
                >
                  {item.icon(isActive)}
                  <span className={cn(
                    'text-[10px] font-semibold',
                    item.label === '新增' && '-mt-0.5'
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
