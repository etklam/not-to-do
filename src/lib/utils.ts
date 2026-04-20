export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getYesterdayDateString(today: string): string {
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(dateStr: string, locale?: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale || 'zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDayLabel(day: number): string {
  return `Day ${day}`
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 100) return '👑'
  if (streak >= 60) return '💎'
  if (streak >= 30) return '🔥'
  if (streak >= 14) return '⭐'
  if (streak >= 7) return '🌱'
  return '🌸'
}

export function daysSince(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date(getTodayDateString() + 'T00:00:00')
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getConsecutiveCheckinDays(dates: string[]): number {
  if (dates.length === 0) return 0
  const today = getTodayDateString()
  const uniqueDates = Array.from(new Set(dates)).sort().reverse()
  if (uniqueDates[0] !== today) return 0
  let count = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00')
    const curr = new Date(uniqueDates[i] + 'T00:00:00')
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      count++
    } else {
      break
    }
  }
  return count
}
