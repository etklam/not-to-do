'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/auth-context'

interface Participant {
  userId: string
  userName: string
  userEmail: string
  notToDoTitle: string
  streak: number
  bestStreak: number
  lastCheckin: string | null
  isActive: boolean
}

interface ChallengeDetail {
  id: string
  title: string
  description: string
  slug: string
  isPublic: boolean
  creatorId: string
  createdAt: string
}

interface UserItem {
  id: string
  title: string
}

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const t = useTranslations('challenge')
  const router = useRouter()
  const { user } = useAuth()

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [hasJoined, setHasJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [items, setItems] = useState<UserItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchChallenge = useCallback(() => {
    fetch(`/api/challenges/${slug}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => {
        setChallenge(data.challenge)
        setParticipants(data.participants || [])
        setHasJoined(data.challenge?.hasJoined || false)
      })
      .catch(() => setChallenge(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  const fetchItems = () => {
    fetch('/api/items', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const active = (data || []).filter((i: { isActive?: boolean }) => i.isActive !== false)
        setItems(active)
        if (active.length > 0) setSelectedItemId(active[0].id)
      })
      .catch(() => setItems([]))
  }

  const handleJoinClick = () => {
    fetchItems()
    setShowJoinModal(true)
  }

  const handleJoinConfirm = async () => {
    if (!selectedItemId || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/challenges/${slug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notToDoId: selectedItemId }),
      })
      if (!res.ok) throw new Error('Failed to join')
      setShowJoinModal(false)
      fetchChallenge()
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/challenges/${slug}/leave`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to leave')
      fetchChallenge()
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/challenges/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/challenges')
    } catch {
      setActionLoading(false)
      setShowDeleteModal(false)
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
      <div className="px-4 pt-6">
        <div className="text-center py-16 animate-fade-in">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold text-kawaii-text mt-4">
            {t('notFound')}
          </h2>
          <Link href="/challenges" className="btn-kawaii-secondary mt-4 inline-flex">
            {t('backToList')}
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = user?.id === challenge.creatorId
  const ranked = [...participants].sort((a, b) => b.streak - a.streak)
  const shamed = participants.filter((p) => p.streak === 0)

  const getMedal = (rank: number) => {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return null
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <Link
          href="/challenges"
          className="w-10 h-10 rounded-full bg-white shadow-kawaii-card flex items-center justify-center hover:shadow-kawaii-card-hover transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4458" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-kawaii-text truncate">
            {challenge.title}
          </h1>
          {challenge.description && (
            <p className="text-sm text-kawaii-text-light mt-0.5 line-clamp-2">
              {challenge.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta + action */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <span className="text-sm text-kawaii-text-light">
          {t('participantCount', { count: participants.length })}
        </span>

        {user && !hasJoined && !isCreator && (
          <button onClick={handleJoinClick} className="btn-kawaii-primary !py-2 !px-4 text-sm">
            {t('join')}
          </button>
        )}
        {user && hasJoined && !isCreator && (
          <button
            onClick={handleLeave}
            disabled={actionLoading}
            className="btn-kawaii-secondary !py-2 !px-4 text-sm"
          >
            {t('leave')}
          </button>
        )}
        {user && isCreator && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-bold text-kawaii-danger bg-kawaii-danger-light rounded-kawaii-sm hover:bg-kawaii-danger-light/80 transition-colors"
          >
            {t('delete')}
          </button>
        )}
      </div>

      {/* Hall of Shame */}
      <div className="card-kawaii mb-4 animate-slide-up" style={{ animationDelay: '0ms' }}>
        <h2 className="text-lg font-extrabold text-kawaii-danger mb-1">
          {t('shameTitle')}
        </h2>
        <p className="text-xs text-kawaii-text-light mb-3">
          {t('shameDesc')}
        </p>

        {shamed.length === 0 ? (
          <div className="py-4 text-center">
            <span className="text-3xl">🎉</span>
            <p className="text-sm text-kawaii-text-light mt-2">
              {t('shameEmpty')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shamed.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-3 px-3 py-2 rounded-kawaii-sm bg-kawaii-danger-light/50 border border-kawaii-danger/20"
              >
                <span className="text-lg">💀</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-kawaii-danger truncate">
                    {p.userName || p.userEmail}
                  </p>
                  <p className="text-xs text-kawaii-text-light truncate">
                    {p.notToDoTitle}
                  </p>
                </div>
                <span className="text-xs font-bold text-kawaii-danger">
                  Day 0
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="card-kawaii mb-4 animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        <h2 className="text-lg font-extrabold text-kawaii-text mb-3">
          {t('rankTitle')}
        </h2>

        {ranked.length === 0 ? (
          <p className="text-sm text-kawaii-text-light text-center py-4">
            {t('noParticipants')}
          </p>
        ) : (
          <div className="space-y-2">
            {ranked.map((p, i) => {
              const medal = getMedal(i)
              return (
                <div
                  key={p.userId}
                  className="flex items-center gap-3 px-3 py-2 rounded-kawaii-sm bg-kawaii-cream"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  <span className="text-lg w-8 text-center font-extrabold text-kawaii-text">
                    {medal || `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-kawaii-text truncate">
                      {p.userName || p.userEmail}
                    </p>
                    <p className="text-xs text-kawaii-text-light truncate">
                      {p.notToDoTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-kawaii-text">
                      Day {p.streak}
                    </p>
                    <p className="text-[10px] text-kawaii-text-light">
                      Best: {p.bestStreak}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card-kawaii w-[90%] max-w-sm mx-auto shadow-kawaii-card animate-slide-up">
            <h3 className="text-lg font-extrabold text-kawaii-text mb-3">
              {t('joinTitle')}
            </h3>
            <p className="text-sm text-kawaii-text-light mb-4">
              {t('joinDesc')}
            </p>

            {items.length === 0 ? (
              <p className="text-sm text-kawaii-text-light mb-4">
                {t('noItems')}
              </p>
            ) : (
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
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="btn-kawaii-secondary flex-1"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleJoinConfirm}
                disabled={!selectedItemId || actionLoading}
                className="btn-kawaii-primary flex-1 disabled:opacity-40"
              >
                {actionLoading ? '...' : t('joinConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card-kawaii w-[90%] max-w-sm mx-auto shadow-kawaii-card animate-slide-up">
            <h3 className="text-lg font-extrabold text-kawaii-text mb-2">
              {t('deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-kawaii-text-light mb-4">
              {t('deleteConfirmDesc')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-kawaii-secondary flex-1"
              >
                {t('deleteConfirmCancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-kawaii font-bold text-white bg-kawaii-danger hover:bg-kawaii-danger/90 transition-colors disabled:opacity-40"
              >
                {actionLoading ? '...' : t('deleteConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
