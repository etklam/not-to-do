import type { Checkin, TemptationLevel } from './types'

// Stable keys for trigger options — stored in checkins
export const TRIGGER_KEYS = [
  'bored',
  'stress',
  'bedtime',
  'procrastinate',
  'socialMedia',
  'lowMood',
  'cravings',
  'other',
] as const

export type TriggerKey = (typeof TRIGGER_KEYS)[number]

// Map legacy Chinese trigger strings → stable keys (for migration)
export const LEGACY_TRIGGER_MAP: Record<string, TriggerKey> = {
  '無聊': 'bored',
  '壓力': 'stress',
  '睡前': 'bedtime',
  '拖延': 'procrastinate',
  '社群媒體': 'socialMedia',
  '情緒低落': 'lowMood',
  '嘴饞': 'cravings',
  '其他': 'other',
}

// Temptation level values (already stable keys)
export const TEMPTATION_KEYS: TemptationLevel[] = ['none', 'some', 'many']

export interface ReflectionResult {
  key: string
  params?: Record<string, string | number>
}

export interface StatusResult {
  key: string
  params?: Record<string, string>
}

export interface CheckinInsightSummary {
  recentCount: number
  successCount: number
  failedCount: number
  temptationDays: number
  topTrigger: string | null
  topTriggers: string[]
  riskWindow: string | null // key like 'riskDawn', 'riskMorning', etc.
  reflection: ReflectionResult
}

function isPressureCheckin(checkin: Checkin): boolean {
  return (
    checkin.status === 'failed' ||
    checkin.temptationLevel === 'some' ||
    checkin.temptationLevel === 'many'
  )
}

function getRecentCheckins(checkins: Checkin[], recentDays: number): Checkin[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (recentDays - 1))

  return checkins
    .filter((checkin) => new Date(checkin.date + 'T00:00:00') >= start)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function getRiskWindowKey(createdAt: string): string {
  const hour = new Date(createdAt).getHours()

  if (hour >= 0 && hour < 5) return 'riskDawn'
  if (hour < 12) return 'riskMorning'
  if (hour < 18) return 'riskAfternoon'
  return 'riskEvening'
}

function getMostCommonValues(values: string[], limit = 3): string[] {
  const counts = new Map<string, number>()

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value)
}

function getReflectionResult(
  recentCount: number,
  failedCount: number,
  temptationDays: number,
  topTrigger: string | null,
  riskWindow: string | null
): ReflectionResult {
  if (recentCount === 0) {
    return { key: 'reflectionEmpty' }
  }

  if (failedCount === 0 && temptationDays === 0) {
    return { key: 'reflectionStable' }
  }

  if (failedCount === 0 && temptationDays > 0) {
    return { key: 'reflectionResistedAll', params: { days: temptationDays } }
  }

  if (topTrigger && riskWindow) {
    return { key: 'reflectionTriggerAndWindow', params: { trigger: topTrigger, window: riskWindow } }
  }

  if (topTrigger) {
    return { key: 'reflectionTriggerOnly', params: { trigger: topTrigger } }
  }

  if (riskWindow) {
    return { key: 'reflectionWindowOnly', params: { window: riskWindow } }
  }

  return { key: 'reflectionGeneral', params: { count: failedCount } }
}

export function getCheckinInsightSummary(
  checkins: Checkin[],
  recentDays = 7
): CheckinInsightSummary {
  const recentCheckins = getRecentCheckins(checkins, recentDays)
  const successCount = recentCheckins.filter((checkin) => checkin.status === 'resisted').length
  const failedCount = recentCheckins.filter((checkin) => checkin.status === 'failed').length
  const temptationDates = new Set(
    recentCheckins
      .filter(isPressureCheckin)
      .map((checkin) => checkin.date)
  )
  const topTriggers = getMostCommonValues(
    recentCheckins.flatMap((checkin) => checkin.triggerTags)
  )
  const pressureCheckins = recentCheckins.filter(isPressureCheckin)
  const riskWindows = getMostCommonValues(
    pressureCheckins.map((checkin) => getRiskWindowKey(checkin.createdAt)),
    1
  )
  const riskWindow =
    pressureCheckins.length >= 2 && riskWindows.length > 0 ? riskWindows[0] : null
  const topTrigger = topTriggers[0] ?? null

  return {
    recentCount: recentCheckins.length,
    successCount,
    failedCount,
    temptationDays: temptationDates.size,
    topTrigger,
    topTriggers,
    riskWindow,
    reflection: getReflectionResult(
      recentCheckins.length,
      failedCount,
      temptationDates.size,
      topTrigger,
      riskWindow
    ),
  }
}

export function getCheckinStatusResult(
  yesterdayCheckin: Checkin | null,
  todayCheckin: Checkin | null
): StatusResult | null {
  if (todayCheckin?.status === 'failed') {
    if (todayCheckin.triggerTags.length > 0) {
      return { key: 'statusTodayFailedTrigger', params: { trigger: todayCheckin.triggerTags[0] } }
    }

    return { key: 'statusTodayFailed' }
  }

  if (!yesterdayCheckin) return null

  if (yesterdayCheckin.status === 'failed') {
    return { key: 'statusYesterdayFailed' }
  }

  if (yesterdayCheckin.temptationLevel === 'many') {
    return { key: 'statusTemptMany' }
  }

  if (yesterdayCheckin.temptationLevel === 'some') {
    return { key: 'statusTemptSome' }
  }

  return { key: 'statusCheckedIn' }
}
