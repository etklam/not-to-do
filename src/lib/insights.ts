import type { Checkin, TemptationLevel } from './types'

export const TRIGGER_OPTIONS = [
  '無聊',
  '壓力',
  '睡前',
  '拖延',
  '社群媒體',
  '情緒低落',
  '嘴饞',
  '其他',
] as const

export const TEMPTATION_OPTIONS: Array<{
  value: TemptationLevel
  label: string
  hint: string
}> = [
  { value: 'none', label: '沒有被誘惑', hint: '那一天意外地很穩' },
  { value: 'some', label: '有想做，但忍住了', hint: '有動搖，但守住了' },
  { value: 'many', label: '很多次都忍住了', hint: '那一天很硬，但你有撐住' },
]

export interface CheckinInsightSummary {
  recentCount: number
  successCount: number
  failedCount: number
  temptationDays: number
  topTrigger: string | null
  topTriggers: string[]
  riskWindow: string | null
  reflection: string
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

function getRiskWindowLabel(createdAt: string): string {
  const hour = new Date(createdAt).getHours()

  if (hour >= 0 && hour < 5) return '凌晨'
  if (hour < 12) return '上午'
  if (hour < 18) return '下午'
  return '晚上'
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

function getReflectionCopy(
  recentCount: number,
  failedCount: number,
  temptationDays: number,
  topTrigger: string | null,
  riskWindow: string | null
): string {
  if (recentCount === 0) {
    return '最近 7 天還沒有足夠資料，先完成今天這次記錄。'
  }

  if (failedCount === 0 && temptationDays === 0) {
    return '這週節奏很穩，還沒有看到明顯的誘惑尖峰。'
  }

  if (failedCount === 0 && temptationDays > 0) {
    return `這週有 ${temptationDays} 天出現誘惑，但你都撐住了。這不是運氣，是正在建立控制力。`
  }

  if (topTrigger && riskWindow) {
    return `最近最容易在${riskWindow}因為${topTrigger}動搖。先處理那個情境，比硬撐更有效。`
  }

  if (topTrigger) {
    return `最近最常見的誘因是${topTrigger}。先拆掉這個觸發點，成功率會明顯上來。`
  }

  if (riskWindow) {
    return `最近比較危險的時段是${riskWindow}。那一段先減少接觸誘惑來源。`
  }

  return `最近 7 天有 ${failedCount} 次破戒。不是意志力爛，是模式還沒拆乾淨。`
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
    pressureCheckins.map((checkin) => getRiskWindowLabel(checkin.createdAt)),
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
    reflection: getReflectionCopy(
      recentCheckins.length,
      failedCount,
      temptationDates.size,
      topTrigger,
      riskWindow
    ),
  }
}

export function getCheckinStatusSummary(
  yesterdayCheckin: Checkin | null,
  todayCheckin: Checkin | null
): string | null {
  if (todayCheckin?.status === 'failed') {
    if (todayCheckin.triggerTags.length > 0) {
      return `今天因 ${todayCheckin.triggerTags[0]} 破戒`
    }

    return '今天已記錄破戒'
  }

  if (!yesterdayCheckin) return null

  if (yesterdayCheckin.status === 'failed') {
    return '昨天已記錄破戒'
  }

  if (yesterdayCheckin.temptationLevel === 'many') {
    return '昨天很多次想破戒，但你都撐住了'
  }

  if (yesterdayCheckin.temptationLevel === 'some') {
    return '昨天有被誘惑，但你撐住了'
  }

  return '昨天已完成打卡'
}
