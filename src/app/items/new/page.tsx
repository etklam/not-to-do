'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useItems } from '@/lib/store'

const SUGGESTIONS = [
  { emoji: '📱', text: '睡前滑手機' },
  { emoji: '🍟', text: '吃垃圾食物' },
  { emoji: '☕', text: '下午喝含糖飲料' },
  { emoji: '📺', text: '追劇追到半夜' },
  { emoji: '🛒', text: '衝動購物' },
  { emoji: '😴', text: '賴床超過 10 分鐘' },
  { emoji: '🎮', text: '工作時間打遊戲' },
  { emoji: '💭', text: '過度焦慮未來的事' },
]

export default function NewItemPage() {
  const router = useRouter()
  const { addItem } = useItems()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    setIsSubmitting(true)
    addItem(title.trim(), description.trim())
    router.push('/')
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white shadow-kawaii-card flex items-center justify-center hover:shadow-kawaii-card-hover transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4458" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-kawaii-text">
          新的不做事項 🚫
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="animate-slide-up">
        <div className="card-kawaii mb-4">
          <label className="block text-sm font-bold text-kawaii-text mb-2">
            我要停止…
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：睡前滑手機"
            maxLength={50}
            autoFocus
            className="w-full px-4 py-3 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-pink-light focus:bg-white outline-none transition-all text-kawaii-text placeholder:text-kawaii-text-light/50 font-semibold"
          />
        </div>

        <div className="card-kawaii mb-6">
          <label className="block text-sm font-bold text-kawaii-text mb-2">
            為什麼想戒掉？
            <span className="font-normal text-kawaii-text-light ml-1">
              （選填）
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="寫下你的動機，提醒未來的自己…"
            maxLength={200}
            rows={3}
            className="w-full px-4 py-3 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-purple-light focus:bg-white outline-none transition-all text-kawaii-text placeholder:text-kawaii-text-light/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="btn-kawaii-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isSubmitting ? '新增中…' : '開始抵抗 💪'}
        </button>
      </form>

      {/* Suggestions */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-kawaii-text-light mb-3">
          💡 或試試這些
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => setTitle(s.text)}
              className="px-3 py-1.5 bg-white rounded-pill text-sm text-kawaii-text border border-kawaii-purple-light/30 hover:border-kawaii-pink-light hover:bg-kawaii-blush transition-all active:scale-95"
            >
              {s.emoji} {s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
