'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/auth-context'

interface ChallengeListItem {
  id: string
  title: string
  description: string
  slug: string
  isPublic: boolean
  participantCount: number
  hasJoined: boolean
  creatorId: string
}

export default function ChallengesPage() {
  const t = useTranslations('challenge')
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetch('/api/challenges', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.challenges) ? data.challenges : []
        setChallenges(list)
      })
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

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

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-kawaii-text">
          {t('title')}
        </h1>
        <Link href="/challenges/new" className="btn-kawaii-primary !py-2 !px-4 text-sm">
          {t('create')}
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="text-5xl mb-4">🏔️</div>
          <p className="text-kawaii-text font-bold mb-1">{t('empty')}</p>
          <p className="text-kawaii-text-light text-sm text-center">
            {t('emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c, i) => (
            <Link
              key={c.id}
              href={`/challenges/${c.slug}`}
              className="block card-kawaii animate-slide-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-kawaii-text truncate">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-sm text-kawaii-text-light mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-kawaii-text-light">
                      👥 {c.participantCount}
                    </span>
                  </div>
                </div>
                {c.hasJoined && (
                  <span className="shrink-0 text-xs font-bold text-kawaii-purple bg-kawaii-purple-light px-2 py-0.5 rounded-kawaii-sm">
                    {t('joined')}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
