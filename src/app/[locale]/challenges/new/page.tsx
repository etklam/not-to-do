'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/auth-context'

interface UserItem {
  id: string
  title: string
}

export default function NewChallengePage() {
  const t = useTranslations('challenge')
  const router = useRouter()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notToDoId, setNotToDoId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [items, setItems] = useState<UserItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetch('/api/items', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : []
        const active = list.filter(
          (i: { isActive?: boolean; mode?: string }) =>
            i.isActive !== false && (i.mode ?? 'personal') === 'personal'
        )
        setItems(active)
        if (active.length > 0) setNotToDoId(active[0].id)
      })
      .catch(() => setItems([]))
  }, [user])

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-kawaii-text-light text-center mb-4">
            {t('needLogin')}
          </p>
          <Link href="/account" className="btn-kawaii-primary">
            {t('needLoginAction')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !notToDoId || isSubmitting) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          sourceItemId: notToDoId,
          isPublic,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create challenge')
      }

      const data = await res.json()
      const slug = data?.challenge?.slug || data?.slug
      if (!slug) throw new Error('Challenge slug missing')
      router.push(`/challenges/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Link
          href="/challenges"
          className="w-10 h-10 rounded-full bg-white shadow-kawaii-card flex items-center justify-center hover:shadow-kawaii-card-hover transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4458" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-kawaii-text">
          {t('newTitle')}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="animate-slide-up">
        {error && (
          <div className="mb-4 p-3 rounded-kawaii-sm bg-kawaii-danger-light text-kawaii-danger text-sm font-medium">
            {error}
          </div>
        )}

        <div className="card-kawaii mb-4">
          <label className="block text-sm font-bold text-kawaii-text mb-2">
            {t('labelTitle')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('placeholderTitle')}
            maxLength={80}
            autoFocus
            required
            className="w-full px-4 py-3 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-pink-light focus:bg-white outline-none transition-all text-kawaii-text placeholder:text-kawaii-text-light/50 font-semibold"
          />
        </div>

        <div className="card-kawaii mb-4">
          <label className="block text-sm font-bold text-kawaii-text mb-2">
            {t('labelDesc')}
            <span className="font-normal text-kawaii-text-light ml-1">
              {t('labelDescOptional')}
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('placeholderDesc')}
            maxLength={300}
            rows={3}
            className="w-full px-4 py-3 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-purple-light focus:bg-white outline-none transition-all text-kawaii-text placeholder:text-kawaii-text-light/50 resize-none"
          />
        </div>

        <div className="card-kawaii mb-4">
          <label className="block text-sm font-bold text-kawaii-text mb-2">
            {t('labelItem')}
          </label>
          {items.length === 0 ? (
            <p className="text-kawaii-text-light text-sm">
              {t('noItems')}
            </p>
          ) : (
            <select
              value={notToDoId}
              onChange={(e) => setNotToDoId(e.target.value)}
              className="w-full px-4 py-3 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-pink-light focus:bg-white outline-none transition-all text-kawaii-text font-semibold"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="card-kawaii mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-kawaii-text">
              {t('labelPublic')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isPublic ? 'bg-kawaii-pink' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          <p className="text-xs text-kawaii-text-light mt-1">
            {t('labelPublicDesc')}
          </p>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !notToDoId || isSubmitting}
          className="btn-kawaii-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}
