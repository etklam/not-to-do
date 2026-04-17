'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import CheckinContextModal from './CheckinContextModal'
import type { CheckinInput, CheckinStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CheckInButtonsProps {
  notToDoId: string
  yesterdayStatus: CheckinStatus | null
  todayStatus: CheckinStatus | null
  todayResistCount: number
  onCheckin: (id: string, input: CheckinInput) => void
  onResist: (id: string) => void
}

export default function CheckInButtons({
  notToDoId,
  yesterdayStatus,
  todayStatus,
  todayResistCount,
  onCheckin,
  onResist,
}: CheckInButtonsProps) {
  const t = useTranslations('checkin')
  const [animating, setAnimating] = useState<CheckinStatus | null>(null)
  const [draftStatus, setDraftStatus] = useState<CheckinStatus | null>(null)
  const [resistAnimating, setResistAnimating] = useState(false)
  const successCheckedIn = yesterdayStatus === 'resisted'
  const yesterdayFailed = yesterdayStatus === 'failed'
  const yesterdayRecorded = yesterdayStatus !== null
  const failedToday = todayStatus === 'failed'

  const handleOpen = useCallback(
    (status: CheckinStatus) => {
      if (status === 'resisted' && yesterdayRecorded) return
      if (status === 'failed' && failedToday) return
      setDraftStatus(status)
    },
    [failedToday, yesterdayRecorded]
  )

  const handleSubmit = useCallback(
    (input: CheckinInput) => {
      setAnimating(input.status)
      onCheckin(notToDoId, input)
      setDraftStatus(null)
      setTimeout(() => setAnimating(null), 400)
    },
    [notToDoId, onCheckin]
  )

  const handleResist = useCallback(() => {
    setResistAnimating(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50)
    }
    onResist(notToDoId)
    setTimeout(() => setResistAnimating(false), 300)
  }, [notToDoId, onResist])

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => handleOpen('resisted')}
            disabled={yesterdayRecorded}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-pill font-bold text-sm',
              'transition-all duration-200 ease-out',
              yesterdayRecorded
                ? 'cursor-not-allowed opacity-70'
                : 'active:scale-95',
              yesterdayStatus === 'resisted'
                ? 'bg-gradient-to-r from-kawaii-mint to-emerald-400 text-white shadow-md'
                : 'bg-kawaii-mint-light text-emerald-700 hover:bg-kawaii-mint hover:text-white',
              animating === 'resisted' && 'animate-bounce-soft'
            )}
          >
            {yesterdayStatus === 'resisted'
              ? t('yesterdayDone')
              : yesterdayStatus === 'failed'
              ? t('yesterdayFailed')
              : t('dayPlus')}
          </button>

          <button
            onClick={() => handleOpen('failed')}
            disabled={failedToday}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-pill font-bold text-sm',
              'transition-all duration-200 ease-out',
              failedToday ? 'cursor-not-allowed opacity-70' : 'active:scale-95',
              todayStatus === 'failed'
                ? 'bg-gradient-to-r from-kawaii-danger to-kawaii-pink text-white shadow-md'
                : 'bg-kawaii-danger-light text-rose-600 hover:bg-kawaii-danger hover:text-white',
              animating === 'failed' && 'animate-shake-soft'
            )}
          >
            {todayStatus === 'failed' ? t('todayFailed') : t('failReset')}
          </button>
        </div>

        <button
          onClick={handleResist}
          className={cn(
            'w-full rounded-pill px-4 py-2.5 text-sm font-bold',
            'bg-white text-kawaii-purple border-2 border-kawaii-purple-light/40',
            'transition-all duration-200 ease-out hover:bg-kawaii-blush active:scale-95',
            resistAnimating && 'animate-bounce-soft'
          )}
        >
          {t('resistPlus')}
          {todayResistCount > 0 && ` ・ ${t('resistCount', { count: todayResistCount })}`}
        </button>

        <p className="text-xs font-medium text-kawaii-text-light">
          {successCheckedIn && failedToday
            ? t('helpBothDone')
            : successCheckedIn
            ? t('helpSuccessDone')
            : yesterdayFailed
            ? t('helpYesterdayFailed')
            : todayStatus === 'failed'
            ? t('helpTodayFailed')
            : t('helpDefault')}
        </p>
      </div>

      <CheckinContextModal
        open={draftStatus !== null}
        status={draftStatus}
        onClose={() => setDraftStatus(null)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
