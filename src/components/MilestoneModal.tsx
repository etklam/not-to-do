'use client'

import { useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import confetti from 'canvas-confetti'
import { getMilestoneKey } from '@/lib/messages'
import { formatDayLabel } from '@/lib/utils'

interface MilestoneModalProps {
  streak: number
  onClose: () => void
}

export default function MilestoneModal({ streak, onClose }: MilestoneModalProps) {
  const t = useTranslations('milestone')

  const fireConfetti = useCallback(() => {
    const colors = ['#FF6B9D', '#C084FC', '#6EE7B7', '#FDE68A', '#FFB8D0']

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      shapes: ['circle', 'square'],
      ticks: 200,
    })

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
    }, 200)
  }, [])

  useEffect(() => {
    fireConfetti()
  }, [fireConfetti])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const milestoneKey = getMilestoneKey(streak)
  const message = milestoneKey === 'default'
    ? t('default', { day: formatDayLabel(streak) })
    : t(milestoneKey)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <div className="absolute inset-0 bg-kawaii-text/20 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-kawaii-lg p-8 max-w-sm w-full text-center shadow-kawaii animate-confetti-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4 animate-float">🎉</div>
        <h2 className="text-2xl font-extrabold text-kawaii-text mb-2">
          {t('title')}
        </h2>
        <p className="text-lg text-kawaii-text-light leading-relaxed mb-6">
          {message}
        </p>
        <button onClick={onClose} className="btn-kawaii-primary w-full">
          {t('close')}
        </button>
      </div>
    </div>
  )
}
