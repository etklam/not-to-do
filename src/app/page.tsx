'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useItems, useCheckins } from '@/lib/store'
import { getCheckinInsightSummary } from '@/lib/insights'
import { getRandomMessage } from '@/lib/messages'
import type { CheckinInput } from '@/lib/types'
import { formatDayLabel, getTodayDateString, getYesterdayDateString } from '@/lib/utils'
import StreakCard from '@/components/StreakCard'
import MilestoneModal from '@/components/MilestoneModal'
import EmptyState from '@/components/EmptyState'

export default function Dashboard() {
  const { items, loaded } = useItems()
  const {
    checkins,
    doCheckin,
    getCheckinForDate,
    recordResist,
    getTodayCheckin,
    getTodayResistCount,
    refreshCheckins,
  } = useCheckins()
  const [message, setMessage] = useState('')
  const [milestone, setMilestone] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setMessage(getRandomMessage())
  }, [])

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    window.addEventListener('ntd-items-updated', handler)
    return () => window.removeEventListener('ntd-items-updated', handler)
  }, [])

  const activeItems = items.filter((it) => it.isActive)
  const weeklyInsight = getCheckinInsightSummary(checkins)

  const handleCheckin = useCallback(
    (id: string, input: CheckinInput) => {
      const result = doCheckin(id, input)
      refreshCheckins()
      if (result.isMilestone) {
        setMilestone(result.newStreak)
      }
    },
    [doCheckin, refreshCheckins]
  )

  const handleResist = useCallback((id: string) => {
    recordResist(id)
  }, [recordResist])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

  // Stats
  const totalStreak = activeItems.reduce((sum, it) => sum + it.streak, 0)
  const today = getTodayDateString()
  const yesterday = getYesterdayDateString(today)
  const todayDone = activeItems.filter(
    (it) => getCheckinForDate(it.id, yesterday)?.status === 'resisted'
  ).length

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold text-kawaii-text">
            今天更新 ☺️
          </h1>
          <div className="text-sm text-kawaii-text-light font-semibold">
            昨天 {todayDone}/{activeItems.length} 已確認
          </div>
        </div>
        <p className="text-sm text-kawaii-text-light">{message}</p>
      </div>

      {/* Stats Bar */}
      {activeItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
          <div className="card-kawaii text-center !p-3">
            <div className="text-2xl font-extrabold text-kawaii-pink">
              {activeItems.length}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              進行中
            </div>
          </div>
          <div className="card-kawaii text-center !p-3">
            <div className="text-xl font-extrabold text-kawaii-purple">
              {formatDayLabel(totalStreak)}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              累計 Day
            </div>
          </div>
          <div className="card-kawaii text-center !p-3">
            <div className="text-2xl font-extrabold text-kawaii-mint">
              {todayDone}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              昨日已打卡
            </div>
          </div>
        </div>
      )}

      {weeklyInsight.recentCount > 0 && (
        <div
          className="card-kawaii mb-6 animate-slide-up"
          style={{ animationDelay: '40ms', animationFillMode: 'both' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-kawaii-text">
              最近 7 天洞察
            </h2>
            <span className="text-xs font-semibold text-kawaii-text-light">
              不是只看 streak
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-kawaii-mint">
                {weeklyInsight.successCount}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                成功記錄
              </div>
            </div>

            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-kawaii-pink">
                {weeklyInsight.temptationDays}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                誘惑日
              </div>
            </div>

            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="truncate text-sm font-extrabold text-kawaii-purple">
                {weeklyInsight.topTrigger ?? '暫無'}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                常見誘因
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[20px] bg-kawaii-blush px-4 py-3">
            <p className="text-xs font-semibold text-kawaii-text-light">
              {weeklyInsight.riskWindow
                ? `最近比較危險的時段：${weeklyInsight.riskWindow}`
                : '最近還沒有明顯固定的危險時段'}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-kawaii-text">
              {weeklyInsight.reflection}
            </p>
          </div>
        </div>
      )}

      {/* Item List */}
      {activeItems.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="還沒有不做清單"
          description="新增你想要戒掉的習慣，開始你的抵抗之旅吧！"
          action={
            <Link href="/items/new" className="btn-kawaii-primary">
              新增第一個 ✨
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4" key={refreshKey}>
          {activeItems.map((item, i) => (
            <StreakCard
              key={item.id}
              item={item}
              yesterdayCheckin={getCheckinForDate(item.id, yesterday)}
              todayCheckin={getTodayCheckin(item.id)}
              todayResistCount={getTodayResistCount(item.id)}
              onCheckin={handleCheckin}
              onResist={handleResist}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Milestone Celebration */}
      {milestone && (
        <MilestoneModal
          streak={milestone}
          onClose={() => setMilestone(null)}
        />
      )}
    </div>
  )
}
