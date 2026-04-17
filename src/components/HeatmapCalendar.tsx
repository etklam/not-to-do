'use client'

import { useMemo } from 'react'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HeatmapCalendarProps {
  checkins: Checkin[]
}

interface DayCell {
  date: string
  status: 'resisted' | 'failed' | 'none' | 'future'
  dayOfMonth: number
}

export default function HeatmapCalendar({ checkins }: HeatmapCalendarProps) {
  const { weeks, monthLabel } = useMemo(() => {
    const today = new Date()
    const checkinMap = new Map<string, 'resisted' | 'failed'>()
    checkins.forEach((c) => {
      checkinMap.set(c.date, c.status)
    })

    // Show last 12 weeks (84 days)
    const days: DayCell[] = []
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 83)

    // Align to start of week (Monday)
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startDate.setDate(startDate.getDate() + mondayOffset)

    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + (7 - (today.getDay() || 7)))

    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().slice(0, 10)
      const isFuture = cursor > today
      const status = isFuture
        ? 'future'
        : checkinMap.get(dateStr) || 'none'
      days.push({
        date: dateStr,
        status,
        dayOfMonth: cursor.getDate(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    // Group into weeks
    const weekGroups: DayCell[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weekGroups.push(days.slice(i, i + 7))
    }

    const label = today.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
    })

    return { weeks: weekGroups, monthLabel: label }
  }, [checkins])

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="card-kawaii">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-kawaii-text">打卡紀錄</h3>
        <span className="text-sm text-kawaii-text-light">{monthLabel}</span>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="w-4 h-4 flex items-center justify-center text-[9px] text-kawaii-text-light"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'w-4 h-4 rounded-[4px] transition-colors duration-200',
                    day.status === 'resisted' &&
                      'bg-kawaii-mint hover:bg-emerald-400',
                    day.status === 'failed' &&
                      'bg-kawaii-danger hover:bg-kawaii-pink',
                    day.status === 'none' &&
                      'bg-kawaii-purple-light/30 hover:bg-kawaii-purple-light/50',
                    day.status === 'future' && 'bg-transparent'
                  )}
                  title={
                    day.status === 'future'
                      ? ''
                      : `${day.date}: ${
                          day.status === 'resisted'
                            ? '已打卡 ✓'
                            : day.status === 'failed'
                            ? '破戒了 ✗'
                            : '未打卡'
                        }`
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-kawaii-text-light">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[3px] bg-kawaii-mint" />
          已打卡
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[3px] bg-kawaii-danger" />
          破戒了
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[3px] bg-kawaii-purple-light/30" />
          未打卡
        </div>
      </div>
    </div>
  )
}
