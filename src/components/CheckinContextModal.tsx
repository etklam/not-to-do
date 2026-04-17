'use client'

import { useEffect, useState } from 'react'
import { TEMPTATION_OPTIONS, TRIGGER_OPTIONS } from '@/lib/insights'
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

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-kawaii-text/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-[28px] bg-white p-5 shadow-kawaii sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-kawaii-text-light">
              {isResisted ? 'Day +1 補充' : '破戒補充'}
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-kawaii-text">
              {isResisted ? '昨天有多想破戒？' : '今天主要是被什麼拉走？'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-kawaii-cream px-3 py-1 text-sm font-bold text-kawaii-text-light"
          >
            關閉
          </button>
        </div>

        {isResisted && (
          <div className="mb-5 space-y-2">
            {TEMPTATION_OPTIONS.map((option) => (
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
                <div className="font-bold text-kawaii-text">{option.label}</div>
                <div className="mt-1 text-xs text-kawaii-text-light">{option.hint}</div>
              </button>
            ))}
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 text-sm font-bold text-kawaii-text">
            {isResisted ? '昨天的誘因是什麼？' : '至少選一個今天的主要誘因'}
            <span className="ml-1 font-normal text-kawaii-text-light">
              {isResisted ? '（選填）' : '（必填）'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((tag) => {
              const active = triggerTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTriggerTag(tag)}
                  className={cn(
                    'rounded-pill px-3 py-2 text-sm font-semibold transition-all duration-200',
                    active
                      ? isResisted
                        ? 'bg-kawaii-mint text-white'
                        : 'bg-kawaii-danger text-white'
                      : 'bg-kawaii-cream text-kawaii-text hover:bg-white'
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {!isResisted && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-kawaii-text">
              補充一句
              <span className="ml-1 font-normal text-kawaii-text-light">（選填）</span>
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={140}
              placeholder="例如：晚上壓力很大，就直接滑下去了"
              className="w-full resize-none rounded-[20px] border-2 border-kawaii-purple-light/30 bg-kawaii-cream px-4 py-3 text-kawaii-text outline-none transition-all focus:border-kawaii-pink-light focus:bg-white"
            />
          </div>
        )}

        <p className="mb-4 text-xs font-medium text-kawaii-text-light">
          {isResisted
            ? 'Day +1 只會記一次昨天；今天的破戒與忍住仍可另外記錄。'
            : '今天的破戒只會記一次，但今天的忍住次數仍可繼續累積。'}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-kawaii-secondary flex-1">
            先取消
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
            {isResisted ? '記錄 Day +1' : '記錄這次破戒'}
          </button>
        </div>
      </div>
    </div>
  )
}
