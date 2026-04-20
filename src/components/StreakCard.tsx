'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { NotToDoItem, Checkin, CheckinInput } from '@/lib/types'
import { getCheckinStatusResult } from '@/lib/insights'
import { cn, formatDayLabel, getStreakEmoji } from '@/lib/utils'
import CheckInButtons from './CheckInButtons'

interface StreakCardProps {
  item: NotToDoItem
  yesterdayCheckin: Checkin | null
  todayCheckin: Checkin | null
  todayResistCount: number
  onCheckin: (id: string, input: CheckinInput) => void
  onResist: (id: string) => void
  index: number
}

function getCardAccent(index: number): string {
  const accents = [
    'border-l-kawaii-pink',
    'border-l-kawaii-purple',
    'border-l-kawaii-mint',
    'border-l-kawaii-yellow',
    'border-l-kawaii-pink-light',
  ]
  return accents[index % accents.length]
}

export default function StreakCard({
  item,
  yesterdayCheckin,
  todayCheckin,
  todayResistCount,
  onCheckin,
  onResist,
  index,
}: StreakCardProps) {
  const t = useTranslations('items')
  const tInsights = useTranslations('insights')
  const tDetail = useTranslations('detail')
  const statusResult = getCheckinStatusResult(yesterdayCheckin, todayCheckin)
  const statusSummary = statusResult
    ? tInsights(statusResult.key, statusResult.params)
    : null

  return (
    <div
      className={cn(
        'card-kawaii border-l-4 animate-slide-up',
        getCardAccent(index)
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-3">
        <Link href={`/items/${item.id}`} className="flex-1 min-w-0 group">
          <h3 className="font-bold text-lg text-kawaii-text group-hover:text-kawaii-pink transition-colors truncate">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-kawaii-text-light mt-0.5 truncate">
              {item.description}
            </p>
          )}
        </Link>

        <div className="flex flex-col items-center ml-4 shrink-0">
          <span className="text-2xl animate-float" style={{ animationDelay: `${index * 200}ms` }}>
            {getStreakEmoji(item.streak)}
          </span>
          <div className="mt-1 text-lg font-extrabold text-kawaii-text transition-all duration-300">
            {formatDayLabel(item.streak)}
          </div>
          {item.bestStreak > item.streak && (
            <span className="text-[10px] text-kawaii-purple font-semibold">
              {t('bestDay', { day: formatDayLabel(item.bestStreak) })}
            </span>
          )}
        </div>
      </div>

      {statusSummary && (
        <p
          className={cn(
            'mb-2 text-xs font-semibold',
            todayCheckin?.status === 'failed' ? 'text-kawaii-danger' : 'text-kawaii-mint'
          )}
        >
          {statusSummary}
        </p>
      )}

      {todayResistCount > 0 && (
        <p className="mb-2 text-xs font-semibold text-kawaii-purple">
          {tDetail('todayResist', { count: todayResistCount })}
        </p>
      )}

      <CheckInButtons
        notToDoId={item.id}
        yesterdayStatus={yesterdayCheckin?.status ?? null}
        todayStatus={todayCheckin?.status ?? null}
        todayResistCount={todayResistCount}
        onCheckin={onCheckin}
        onResist={onResist}
      />
    </div>
  )
}
