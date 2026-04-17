'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TRIGGER_KEYS } from '@/lib/insights'
import type { CheckinInput, CheckinStatus, TemptationLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CheckinContextModalProps {
  open: boolean
  status: CheckinStatus | null
  onClose: () => void
  onSubmit: (input: CheckinInput) => void
}

export default function CheckinContextModal({
  open,
  status,
  onClose,
  onSubmit,
}: CheckinContextModalProps) {
  const t = useTranslations('modal')
  const tTriggers = useTranslations('triggers')
  const [temptationLevel, setTemptationLevel] = useState<TemptationLevel | null>(null)
  const [triggerTags, setTriggerTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setTemptationLevel(null)
    setTriggerTags([])
    setNote('')
  }, [open, status])

  if (!open || !status) return null

  const isResisted = status === 'resisted'
  const canSubmit = isResisted ? temptationLevel !== null : triggerTags.length > 0

  const toggleTriggerTag = (tag: string) => {
    setTriggerTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag]
    )
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    onSubmit({
      status,
      temptationLevel: isResisted ? temptationLevel : null,
      triggerTags,
      note: isResisted ? '' : note.trim(),
    })
  }

  const temptationOptions: Array<{ value: TemptationLevel; labelKey: string; hintKey: string }> = [
    { value: 'none', labelKey: 'temptNone', hintKey: 'temptNoneHint' },
    { value: 'some', labelKey: 'temptSome', hintKey: 'temptSomeHint' },
    { value: 'many', labelKey: 'temptMany', hintKey: 'temptManyHint' },
  ]

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-kawaii-text/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-[28px] bg-white p-5 shadow-kawaii sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-kawaii-text-light">
              {isResisted ? t('resistHeader') : t('failHeader')}
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-kawaii-text">
              {isResisted ? t('resistQuestion') : t('failQuestion')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-kawaii-cream px-3 py-1 text-sm font-bold text-kawaii-text-light"
          >
            {t('close')}
          </button>
        </div>

        {isResisted && (
          <div className="mb-5 space-y-2">
            {temptationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTemptationLevel(option.value)}
                className={cn(
                  'w-full rounded-[20px] border-2 px-4 py-3 text-left transition-all duration-200',
                  temptationLevel === option.value
                    ? 'border-kawaii-mint bg-kawaii-mint-light/40 shadow-kawaii-card'
                    : 'border-kawaii-purple-light/30 bg-kawaii-cream hover:border-kawaii-pink-light hover:bg-white'
                )}
              >
                <div className="font-bold text-kawaii-text">{t(option.labelKey)}</div>
                <div className="mt-1 text-xs text-kawaii-text-light">{t(option.hintKey)}</div>
              </button>
            ))}
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 text-sm font-bold text-kawaii-text">
            {isResisted ? t('triggerLabel') : t('triggerLabelFail')}
            <span className="ml-1 font-normal text-kawaii-text-light">
              {isResisted ? t('triggerOptional') : t('triggerRequired')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TRIGGER_KEYS.map((key) => {
              const active = triggerTags.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleTriggerTag(key)}
                  className={cn(
                    'rounded-pill px-3 py-2 text-sm font-semibold transition-all duration-200',
                    active
                      ? isResisted
                        ? 'bg-kawaii-mint text-white'
                        : 'bg-kawaii-danger text-white'
                      : 'bg-kawaii-cream text-kawaii-text hover:bg-white'
                  )}
                >
                  {tTriggers(key)}
                </button>
              )
            })}
          </div>
        </div>

        {!isResisted && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-kawaii-text">
              {t('noteLabel')}
              <span className="ml-1 font-normal text-kawaii-text-light">{t('noteOptional')}</span>
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={140}
              placeholder={t('notePlaceholder')}
              className="w-full resize-none rounded-[20px] border-2 border-kawaii-purple-light/30 bg-kawaii-cream px-4 py-3 text-kawaii-text outline-none transition-all focus:border-kawaii-pink-light focus:bg-white"
            />
          </div>
        )}

        <p className="mb-4 text-xs font-medium text-kawaii-text-light">
          {isResisted ? t('helpResist') : t('helpFail')}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-kawaii-secondary flex-1">
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex-1',
              isResisted ? 'btn-kawaii-mint' : 'btn-kawaii-danger',
              !canSubmit && 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none'
            )}
          >
            {isResisted ? t('submitResist') : t('submitFail')}
          </button>
        </div>
      </div>
    </div>
  )
}
