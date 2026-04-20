'use client'

import { useEffect, useMemo, useState, use } from 'react'
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
  params: Promise<{ shareCode: string }>
}) {
  const { shareCode } = use(params)
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
    if (!user) return 'login'
    if (hasJoined) return 'open'
    return 'join'
  }, [challenge, user, hasJoined])

  const handleJoin = async () => {
    if (!selectedItemId || actionLoading || !challenge) return
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/challenges/share/${shareCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourceItemId: selectedItemId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to join challenge')
      }
      router.push(`/challenges/${challenge.slug}`)
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
          Back to challenges
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
          {participantCount} participants
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-kawaii-sm bg-kawaii-danger-light text-kawaii-danger text-sm font-medium">
          {error}
        </div>
      )}

      {cta === 'login' && (
        <div className="mt-4">
          <Link href="/account" className="btn-kawaii-primary w-full text-center">
            Log in to join
          </Link>
        </div>
      )}

      {cta === 'open' && (
        <div className="mt-4">
          <Link
            href={`/challenges/${challenge.slug}`}
            className="btn-kawaii-primary w-full text-center"
          >
            Open challenge
          </Link>
        </div>
      )}

      {cta === 'join' && (
        <div className="mt-4 card-kawaii">
          <p className="text-sm text-kawaii-text-light mb-3">
            Select one of your personal items to join this challenge.
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-kawaii-text-light mb-3">
              No active personal items available.
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
          <button
            type="button"
            onClick={handleJoin}
            disabled={actionLoading || !selectedItemId}
            className="btn-kawaii-primary w-full disabled:opacity-40"
          >
            {actionLoading ? 'Joining...' : 'Join challenge'}
          </button>
        </div>
      )}
    </div>
  )
}
