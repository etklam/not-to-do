'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { getCheckinInsightSummary, getCheckinStatusResult } from '@/lib/insights'
import { useItems, useCheckins } from '@/lib/unified-store'

import HeatmapCalendar from '@/components/HeatmapCalendar'
import CheckInButtons from '@/components/CheckInButtons'
import MilestoneModal from '@/components/MilestoneModal'
import type { NotToDoItem, CheckinInput } from '@/lib/types'
import { cn, formatDayLabel, getTodayDateString, getYesterdayDateString } from '@/lib/utils'

export default function ItemDetailPage() {
  const t = useTranslations('detail')
  const tTriggers = useTranslations('triggers')
  const tInsights = useTranslations('insights')
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
            {t('notFound')}
          </h2>
          <Link href="/" className="btn-kawaii-secondary mt-4 inline-flex">
            {t('backHome')}
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
  const statusResult = getCheckinStatusResult(yesterdayCheckin, todayCheckin)
  const statusSummary = statusResult
    ? tInsights(statusResult.key, statusResult.params)
    : null
  const resistRate =
    allCheckins.length > 0
      ? Math.round((resistedDays / allCheckins.length) * 100)
      : 0

  // Resolve reflection
  const reflectionText = insightSummary.reflection.key
    ? tInsights(insightSummary.reflection.key, insightSummary.reflection.params as Record<string, string>)
    : ''

  const handleCheckin = async (itemId: string, input: CheckinInput) => {
    const result = await doCheckin(itemId, input)
    refreshCheckins()
    if (result.isMilestone) {
      setMilestone(result.newStreak)
    }
  }

  const handleResist = (itemId: string) => {
    recordResist(itemId)
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

      {/* Big Day Streak Display */}
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
        <div className="text-4xl font-extrabold text-kawaii-text transition-all duration-300">
          {formatDayLabel(item.streak)}
        </div>
        <p className="text-sm text-kawaii-text-light mt-1">
          {item.streak === 0
            ? t('streakZero')
            : t('streakCurrent', { day: formatDayLabel(item.streak) })}
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
                {tTriggers(tag)}
              </span>
            ))}
          </div>
        )}
        {todayResistCount > 0 && (
          <p className="mt-3 text-xs font-semibold text-kawaii-purple">
            {t('todayResist', { count: todayResistCount })}
          </p>
        )}
      </div>

      {/* Today's Check-in */}
      <div
        className="card-kawaii mb-4 animate-slide-up"
        style={{ animationDelay: '60ms', animationFillMode: 'both' }}
      >
        <h3 className="font-bold text-kawaii-text mb-3">{t('todayUpdate')}</h3>
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
            {t('statBest')}
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-2xl font-extrabold text-kawaii-mint">
            {resistRate}%
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            {t('statRate')}
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-xl font-extrabold text-kawaii-mint">
            {formatDayLabel(resistedDays)}
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            {t('statSuccess')}
          </div>
        </div>
        <div className="card-kawaii text-center !p-3">
          <div className="text-xl font-extrabold text-kawaii-danger">
            {formatDayLabel(failedDays)}
          </div>
          <div className="text-[10px] text-kawaii-text-light font-semibold">
            {t('statFailed')}
          </div>
        </div>
      </div>

      <div
        className="card-kawaii mb-4 animate-slide-up"
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-kawaii-text">{t('insightTitle')}</h3>
          <span className="text-xs font-semibold text-kawaii-text-light">
            {t('insightSubtitle')}
          </span>
        </div>

        {insightSummary.recentCount === 0 ? (
          <p className="text-sm leading-relaxed text-kawaii-text-light">
            {t('insightEmpty')}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-kawaii-mint">
                  {insightSummary.successCount}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  {t('insightSuccessDays')}
                </div>
              </div>
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="text-lg font-extrabold text-kawaii-pink">
                  {insightSummary.temptationDays}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  {t('insightTemptation')}
                </div>
              </div>
              <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
                <div className="truncate text-sm font-extrabold text-kawaii-purple">
                  {insightSummary.topTrigger
                    ? tTriggers(insightSummary.topTrigger)
                    : t('insightNone')}
                </div>
                <div className="text-[10px] font-semibold text-kawaii-text-light">
                  {t('insightTrigger')}
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
                    {tTriggers(tag)}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-[20px] bg-kawaii-cream px-4 py-3">
              <p className="text-xs font-semibold text-kawaii-text-light">
                {insightSummary.riskWindow
                  ? t('insightRiskWindow', { window: tInsights(insightSummary.riskWindow) })
                  : t('insightNoRisk')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-kawaii-text">
                {reflectionText}
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
          {t('archiveAction')}
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
