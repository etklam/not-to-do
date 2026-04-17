'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCheckinInsightSummary, getCheckinStatusSummary } from '@/lib/insights'
import { useItems, useCheckins } from '@/lib/store'

import HeatmapCalendar from '@/components/HeatmapCalendar'
import CheckInButtons from '@/components/CheckInButtons'
import MilestoneModal from '@/components/MilestoneModal'
import type { NotToDoItem, CheckinInput } from '@/lib/types'
import { cn, formatDayLabel, getTodayDateString, getYesterdayDateString } from '@/lib/utils'

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { items, loaded, archiveItem } = useItems()
  const {
    doCheckin,
    getCheckinForDate,
    recordResist,
    getTodayCheckin,
    getTodayResistCount,
    getCheckinsForItem,
    refreshCheckins,
  } =
    useCheckins()
  const [milestone, setMilestone] = useState<number | null>(null)
  const [item, setItem] = useState<NotToDoItem | null>(null)

  useEffect(() => {
    if (loaded) {
      const found = items.find((it) => it.id === id) ?? null
      setItem(found)
    }
  }, [items, loaded, id])

  // Listen for item updates
  useEffect(() => {
    const handler = () => {
      const raw = localStorage.getItem('ntd_items')
      if (raw) {
        const all: NotToDoItem[] = JSON.parse(raw)
        setItem(all.find((it) => it.id === id) ?? null)
      }
    }
    window.addEventListener('ntd-items-updated', handler)
    return () => window.removeEventListener('ntd-items-updated', handler)
  }, [id])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="px-4 pt-6">
        <div className="text-center py-16 animate-fade-in">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold text-kawaii-text mt-4">
            找不到這個項目
          </h2>
          <Link href="/" className="btn-kawaii-secondary mt-4 inline-flex">
            回到首頁
          </Link>
        </div>
      </div>
    )
  }

  const today = getTodayDateString()
  const yesterday = getYesterdayDateString(today)
  const yesterdayCheckin = getCheckinForDate(item.id, yesterday)
  const todayCheckin = getTodayCheckin(item.id)
  const todayResistCount = getTodayResistCount(item.id)
  const allCheckins = getCheckinsForItem(item.id)
  const latestStatusCheckin =
    todayCheckin?.status === 'failed' ? todayCheckin : yesterdayCheckin
  const resistedDays = allCheckins.filter((c) => c.status === 'resisted').length
  const failedDays = allCheckins.filter((c) => c.status === 'failed').length
  const insightSummary = getCheckinInsightSummary(allCheckins)
  const statusSummary = getCheckinStatusSummary(yesterdayCheckin, todayCheckin)
  const resistRate =
    allCheckins.length > 0
      ? Math.round((resistedDays / allCheckins.length) * 100)
      : 0

  const handleCheckin = (id: string, input: CheckinInput) => {
    const result = doCheckin(id, input)
    refreshCheckins()
    if (result.isMilestone) {
      setMilestone(result.newStreak)
    }
  }

  const handleResist = (id: string) => {
    recordResist(id)
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white shadow-kawaii-card flex items-center justify-center hover:shadow-kawaii-card-hover transition-all active:scale-95"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4A4458"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-kawaii-text truncate">
            {item.title}
          </h1>
          {item.description && (
            <p className="text-sm text-kawaii-text-light truncate">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Big Day Streak Display — 主角 */}
      <div className="card-kawaii text-center mb-4 animate-slide-up">
        <div className="text-5xl mb-2 animate-float">
          {item.streak >= 100
            ? '👑'
            : item.streak >= 30
            ? '🏆'
            : item.streak >= 7
            ? '🔥'
            : '🌱'}
        </div>
        <div className="text-4xl font-extrabold text-kawaii-text">
          {formatDayLabel(item.streak)}
        </div>
        <p className="text-sm text-kawaii-text-light mt-1">
          {item.streak === 0
            ? '已回到 Day 0'
            : `目前來到 ${formatDayLabel(item.streak)}`}
        </p>
        {statusSummary && (
          <p
            className={cn(
              'mt-2 text-xs font-semibold',
              todayCheckin?.status === 'failed' ? 'text-kawaii-danger' : 'text-kawaii-mint'
            )}
          >
            {statusSummary}
          </p>
        )}
        {latestStatusCheckin && latestStatusCheckin.triggerTags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {latestStatusCheckin.triggerTags.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-kawaii-cream px-3 py-1 text-[11px] font-semibold text-kawaii-text-light"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {todayResistCount > 0 && (
          <p className="mt-3 text-xs font-semibold text-kawaii-purple">
            今日忍住 {todayResistCount} 次
          </p>
        )}
      </div>

      {/* Today's Check-in */}
      <div
        className="card-kawaii mb-4 animate-slide-up"
        style={{ animationDelay: '60ms', animationFillMode: 'both' }}
      >
        <h3 className="font-bold text-kawaii-text mb-3">今天更新</h3>
        <CheckInButtons
          notToDoId={item.id}
          yesterdayStatus={yesterdayCheckin?.status ?? null}
          todayStatus={todayCheckin?.status ?? null}
          todayResistCount={todayResistCount}
          onCheckin={handleCheckin}
          onResist={handleResist}
        />
      </div>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-2 gap-3 mb-4 animate-slide-up"
        style={{ animationDelay: '120ms', animationFillMode: 'both' }}
      >
        <div className="card-kawaii text-center !p-3">
          <div className="text-xl font-extrabold text-kawaii-purple">
            {formatDayLabel(item.bestStreak)}
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            最佳紀錄
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-2xl font-extrabold text-kawaii-mint">
            {resistRate}%
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            成功率
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-xl font-extrabold text-emerald-500">
            {formatDayLabel(resistedDays)}
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            成功紀錄
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-xl font-extrabold text-kawaii-danger">
            {formatDayLabel(failedDays)}
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            破戒紀錄
          </div>
        </div>
      </div>

      <div
        className="card-kawaii mb-4 animate-slide-up"
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-kawaii-text">最近 7 天洞察</h3>
          <span className="text-xs font-semibold text-kawaii-text-light">
            看模式，不只看天數
          </span>
        </div>

        {insightSummary.recentCount === 0 ? (
          <p className="text-sm leading-relaxed text-kawaii-text-light">
            再累積幾天資料，這裡就會開始告訴你最常見的誘因與危險時段。
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-kawaii-mint">
                  {insightSummary.successCount}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  成功天數
                </div>
              </div>
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-kawaii-pink">
                  {insightSummary.temptationDays}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  誘惑日
                </div>
              </div>
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="truncate text-sm font-extrabold text-kawaii-purple">
                  {insightSummary.topTrigger ?? '暫無'}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  常見誘因
                </div>
              </div>
            </div>

            {insightSummary.topTriggers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {insightSummary.topTriggers.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill bg-kawaii-blush px-3 py-1.5 text-xs font-semibold text-kawaii-text"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-[20px] bg-kawaii-cream px-4 py-3">
              <p className="text-xs font-semibold text-kawaii-text-light">
                {insightSummary.riskWindow
                  ? `最近比較危險的時段：${insightSummary.riskWindow}`
                  : '最近還沒有明顯固定的危險時段'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-kawaii-text">
                {insightSummary.reflection}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Heatmap */}
      <div
        className="mb-4 animate-slide-up"
        style={{ animationDelay: '210ms', animationFillMode: 'both' }}
      >
        <HeatmapCalendar checkins={allCheckins} />
      </div>

      {/* Actions */}
      <div
        className="animate-slide-up"
        style={{ animationDelay: '270ms', animationFillMode: 'both' }}
      >
        <button
          onClick={() => {
            archiveItem(item.id)
            router.push('/items')
          }}
          className="btn-kawaii-ghost w-full text-sm"
        >
          封存這個項目
        </button>
      </div>

      {/* Milestone */}
      {milestone && (
        <MilestoneModal
          streak={milestone}
          onClose={() => setMilestone(null)}
        />
      )}
    </div>
  )
}
