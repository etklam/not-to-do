'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations, useMessages } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useItems, useCheckins } from '@/lib/unified-store'
import { getCheckinInsightSummary } from '@/lib/insights'
import { getRandomMessageIndex } from '@/lib/messages'
import type { CheckinInput } from '@/lib/types'
import { formatDayLabel, getTodayDateString, getYesterdayDateString } from '@/lib/utils'
import StreakCard from '@/components/StreakCard'
import MilestoneModal from '@/components/MilestoneModal'
import EmptyState from '@/components/EmptyState'
import LocaleSwitcher from '@/components/LocaleSwitcher'

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const tTriggers = useTranslations('triggers')
  const tInsights = useTranslations('insights')
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
  const [messageIndex, setMessageIndex] = useState(-1)
  const [milestone, setMilestone] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const dateRef = useRef(getTodayDateString())
  const allMessages = useMessages()
  const messagesArray = (allMessages.messages ?? []) as string[]

  // Random encouragement message
  useEffect(() => {
    setMessageIndex(getRandomMessageIndex(messagesArray.length))
  }, [messagesArray.length])

  // First-use onboarding hint
  useEffect(() => {
    const key = 'ntd_onboarding_seen'
    if (!localStorage.getItem(key) && loaded && items.length === 0) {
      setShowOnboarding(true)
    }
  }, [loaded, items.length])

  const dismissOnboarding = () => {
    localStorage.setItem('ntd_onboarding_seen', '1')
    setShowOnboarding(false)
  }

  // Midnight state refresh
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        const now = getTodayDateString()
        if (now !== dateRef.current) {
          dateRef.current = now
          refreshCheckins()
          setRefreshKey((k) => k + 1)
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [refreshCheckins])

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    window.addEventListener('ntd-items-updated', handler)
    return () => window.removeEventListener('ntd-items-updated', handler)
  }, [])

  const activeItems = items.filter((it) => it.isActive)
  const weeklyInsight = getCheckinInsightSummary(checkins)

  const handleCheckin = useCallback(
    async (id: string, input: CheckinInput) => {
      const result = await doCheckin(id, input)
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

  // Resolve reflection to translated string
  const reflectionText = weeklyInsight.reflection.key
    ? tInsights(weeklyInsight.reflection.key, weeklyInsight.reflection.params as Record<string, string>)
    : ''

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold text-kawaii-text">
            {t('title')}
          </h1>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <div className="text-sm text-kawaii-text-light font-semibold">
              {t('yesterdayCount', { done: todayDone, total: activeItems.length })}
            </div>
          </div>
        </div>
        {messageIndex >= 0 && (
          <p className="text-sm text-kawaii-text-light">{messagesArray[messageIndex]}</p>
        )}
      </div>

      {/* First-use onboarding hint */}
      {showOnboarding && (
        <div className="card-kawaii mb-6 animate-slide-up bg-kawaii-blush border border-kawaii-purple-light/30">
          <h3 className="font-bold text-kawaii-text mb-2">{t('onboardingTitle')}</h3>
          <ul className="space-y-1.5 text-sm text-kawaii-text-light mb-3">
            <li>✅ {t('onboardingDay')}</li>
            <li>💥 {t('onboardingFail')}</li>
            <li>💪 {t('onboardingResist')}</li>
          </ul>
          <button
            onClick={dismissOnboarding}
            className="btn-kawaii-secondary text-sm !py-1.5"
          >
            {t('onboardingDismiss')}
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {activeItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
          <div className="card-kawaii text-center !p-3">
            <div className="text-2xl font-extrabold text-kawaii-pink">
              {activeItems.length}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              {t('statActive')}
            </div>
          </div>
          <div className="card-kawaii text-center !p-3">
            <div className="text-xl font-extrabold text-kawaii-purple">
              {formatDayLabel(totalStreak)}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              {t('statTotalDay')}
            </div>
          </div>
          <div className="card-kawaii text-center !p-3">
            <div className="text-2xl font-extrabold text-kawaii-mint">
              {todayDone}
            </div>
            <div className="text-[10px] text-kawaii-text-light font-semibold">
              {t('statConfirmed')}
            </div>
          </div>
        </div>
      )}

      {weeklyInsight.recentCount > 0 ? (
        <div
          className="card-kawaii mb-6 animate-slide-up"
          style={{ animationDelay: '40ms', animationFillMode: 'both' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-kawaii-text">
              {t('insightTitle')}
            </h2>
            <span className="text-xs font-semibold text-kawaii-text-light">
              {t('insightSubtitle')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-kawaii-mint">
                {weeklyInsight.successCount}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                {t('insightSuccess')}
              </div>
            </div>

            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-kawaii-pink">
                {weeklyInsight.temptationDays}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                {t('insightTemptation')}
              </div>
            </div>

            <div className="rounded-[20px] bg-kawaii-cream px-3 py-3 text-center">
              <div className="truncate text-sm font-extrabold text-kawaii-purple">
                {weeklyInsight.topTrigger
                  ? tTriggers(weeklyInsight.topTrigger)
                  : t('insightNone')}
              </div>
              <div className="text-[10px] font-semibold text-kawaii-text-light">
                {t('insightTrigger')}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[20px] bg-kawaii-blush px-4 py-3">
            <p className="text-xs font-semibold text-kawaii-text-light">
              {weeklyInsight.riskWindow
                ? t('insightRiskWindow', { window: tInsights(weeklyInsight.riskWindow) })
                : t('insightNoRisk')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-kawaii-text">
              {reflectionText}
            </p>
          </div>
        </div>
      ) : activeItems.length > 0 ? (
        <div
          className="card-kawaii mb-6 animate-slide-up text-center py-6"
          style={{ animationDelay: '40ms', animationFillMode: 'both' }}
        >
          <p className="text-sm text-kawaii-text-light">
            {t('insightEmptyTitle')}
          </p>
        </div>
      ) : null}

      {/* Item List */}
      {activeItems.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Link href="/items/new" className="btn-kawaii-primary">
              {t('emptyAction')}
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
