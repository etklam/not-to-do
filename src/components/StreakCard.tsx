'use client'

import Link from 'next/link'
import type { NotToDoItem, Checkin, CheckinInput } from '@/lib/types'
import { getCheckinStatusSummary } from '@/lib/insights'
import { cn, formatDayLabel } from '@/lib/utils'
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

function getStreakEmoji(streak: number): string {
  if (streak >= 100) return '👑'
  if (streak >= 60) return '💎'
  if (streak >= 30) return '🏆'
  if (streak >= 14) return '🌟'
  if (streak >= 7) return '🔥'
  if (streak >= 3) return '✨'
  return '🌱'
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
  const statusSummary = getCheckinStatusSummary(yesterdayCheckin, todayCheckin)

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
          <div className="mt-1 text-lg font-extrabold text-kawaii-text">
            {formatDayLabel(item.streak)}
          </div>
          {item.bestStreak > item.streak && (
            <span className="text-[10px] text-kawaii-purple font-semibold">
              最佳 {formatDayLabel(item.bestStreak)}
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
          今日忍住 {todayResistCount} 次
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
