'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/auth-context'

interface ShareChallenge {
  id: string
  title: string
  description: string
  slug: string
  isPublic: boolean
}

interface UserItem {
  id: string
  title: string
}

export default function ChallengeSharePage({
  params,
}: {
  params: { shareCode: string }
}) {
  const { shareCode } = params
  const t = useTranslations('challenge')
  const router = useRouter()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState<ShareChallenge | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [hasJoined, setHasJoined] = useState(false)
  const [items, setItems] = useState<UserItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/challenges/share/${shareCode}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Challenge not found')
        return res.json()
      })
      .then((data) => {
        setChallenge(data.challenge || null)
        setParticipantCount(Number(data.participantCount || 0))
        setHasJoined(Boolean(data.hasJoined))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => setLoading(false))
  }, [shareCode])

  useEffect(() => {
    if (!user || hasJoined) return
    fetch('/api/items', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : []
        const active = list.filter(
          (i: { isActive?: boolean; mode?: string }) =>
            i.isActive !== false && (i.mode ?? 'personal') === 'personal'
        )
        setItems(active)
        if (active.length > 0) setSelectedItemId(active[0].id)
      })
      .catch(() => setItems([]))
  }, [user, hasJoined])

  const cta = useMemo(() => {
    if (!challenge) return null
    if (hasJoined) return 'open'
    return 'join'
  }, [challenge, hasJoined])

  const handleJoin = async () => {
    if (actionLoading || !challenge) return
    setActionLoading(true)
    setError('')
    try {
      const payload =
        user && selectedItemId ? { sourceItemId: selectedItemId } : {}
      const res = await fetch(`/api/challenges/share/${shareCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to join challenge')
      }
      router.push(`/challenges/${challenge.slug}?joined=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="px-4 pt-6 pb-4 text-center">
        <h1 className="text-xl font-bold text-kawaii-text mb-2">Challenge not found</h1>
        {error && <p className="text-sm text-kawaii-danger">{error}</p>}
        <Link href="/challenges" className="btn-kawaii-secondary mt-4 inline-flex">
          {t('backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="card-kawaii">
        <h1 className="text-2xl font-extrabold text-kawaii-text">{challenge.title}</h1>
        {challenge.description && (
          <p className="text-sm text-kawaii-text-light mt-2">{challenge.description}</p>
        )}
        <p className="text-xs text-kawaii-text-light mt-3">
          {t('participantCount', { count: participantCount })}
        </p>
      </div>

      <div className="mt-4 card-kawaii">
        <h2 className="text-base font-extrabold text-kawaii-text mb-2">
          {t('shareWhatHappensTitle')}
        </h2>
        <ul className="space-y-1 text-sm text-kawaii-text-light">
          <li>1. {t('shareStepSelectItem')}</li>
          <li>2. {t('shareStepCreateCopy')}</li>
          <li>3. {t('shareStepTrackTogether')}</li>
        </ul>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-kawaii-sm bg-kawaii-danger-light text-kawaii-danger text-sm font-medium">
          {error}
        </div>
      )}

      {cta === 'open' && (
        <div className="mt-4">
          <div className="mb-3 rounded-kawaii-sm bg-kawaii-mint-light/40 px-3 py-2 text-sm font-semibold text-emerald-700">
            {t('shareAlreadyJoined')}
          </div>
          <Link
            href={`/challenges/${challenge.slug}`}
            className="btn-kawaii-primary w-full text-center"
          >
            {t('shareOpenCta')}
          </Link>
        </div>
      )}

      {cta === 'join' && (
        <div className="mt-4 card-kawaii">
          <p className="text-sm text-kawaii-text-light mb-3">
            {user ? t('shareSelectItemHint') : t('shareGuestHint')}
          </p>
          {user && items.length === 0 ? (
            <p className="text-sm text-kawaii-text-light mb-3">
              {t('shareNoPersonalItems')}
            </p>
          ) : user ? (
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-3 mb-4 bg-kawaii-cream rounded-kawaii-sm border-2 border-transparent focus:border-kawaii-pink-light focus:bg-white outline-none transition-all text-kawaii-text font-semibold"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-kawaii-text-light mb-3">
              {t('shareAutoCreateItem')}
            </p>
          )}
          <button
            type="button"
            onClick={handleJoin}
            disabled={actionLoading}
            className="btn-kawaii-primary w-full disabled:opacity-40"
          >
            {actionLoading ? t('shareJoining') : t('shareJoinCta')}
          </button>
        </div>
      )}
    </div>
  )
}
