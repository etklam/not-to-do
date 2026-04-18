'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import type {
  NotToDoItem,
  Checkin,
  CheckinInput,
  DailyResistLog,
  ItemUpdates,
} from './types'
import { v4 as uuidv4 } from 'uuid'

// ─── API-backed Items Hook ───

function normalizeItem(it: Record<string, unknown>): NotToDoItem {
  return {
    id: String(it.id),
    title: String(it.title),
    description: String(it.description || ''),
    streak: Number(it.streak || 0),
    bestStreak: Number(it.bestStreak || it.best_streak || 0),
    lastCheckin: String(it.lastCheckin || it.last_checkin || '') || null,
    isActive: Boolean(it.isActive ?? it.is_active ?? true),
    createdAt: String(it.createdAt || it.created_at || new Date().toISOString()),
  }
}

export function useApiItems() {
  const { user } = useAuth()
  const [items, setItems] = useState<NotToDoItem[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/items')
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items.map(normalizeItem))
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchItems()
    else setLoaded(true)
  }, [user, fetchItems])

  const addItem = useCallback(
    async (title: string, description: string) => {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const item = normalizeItem(data.item)
      setItems((prev) => [...prev, item])
      return item
    },
    []
  )

  const archiveItem = useCallback(async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isActive: false } : it))
    )
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const restoreItem = useCallback(async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isActive: true } : it))
    )
  }, [])

  const updateItem = useCallback(async (id: string, updates: ItemUpdates) => {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return null

    const data = await res.json()
    const item = normalizeItem(data.item)
    setItems((prev) => prev.map((it) => (it.id === id ? item : it)))
    return item
  }, [])

  const getItem = useCallback(
    (id: string) => items.find((it) => it.id === id) ?? null,
    [items]
  )

  return {
    items,
    loaded,
    addItem,
    archiveItem,
    deleteItem,
    restoreItem,
    updateItem,
    getItem,
  }
}

// ─── API-backed Checkins Hook ───

export function useApiCheckins() {
  const [checkins] = useState<Checkin[]>([])
  const [dailyResists, setDailyResists] = useState<DailyResistLog[]>([])

  const recordResist = useCallback(
    async (notToDoId: string): Promise<number> => {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/resists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notToDoId, date: today }),
      })
      if (!res.ok) return 0
      const data = await res.json()
      setDailyResists((prev) => {
        const existing = prev.findIndex(
          (r) => r.notToDoId === notToDoId && r.date === today
        )
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = { ...updated[existing], count: data.count }
          return updated
        }
        return [
          ...prev,
          {
            id: uuidv4(),
            notToDoId,
            date: today,
            count: data.count,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      })
      return data.count
    },
    []
  )

  const doCheckin = useCallback(
    async (
      notToDoId: string,
      input: CheckinInput
    ): Promise<{ newStreak: number; isMilestone: boolean }> => {
      const today = new Date().toISOString().split('T')[0]
      const d = new Date(today + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      const yesterday = d.toISOString().split('T')[0]
      const targetDate = input.status === 'resisted' ? yesterday : today

      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notToDoId,
          date: targetDate,
          status: input.status,
          temptationLevel: input.temptationLevel,
          triggerTags: input.triggerTags,
          note: input.note,
        }),
      })

      if (!res.ok) return { newStreak: 0, isMilestone: false }

      // Refresh items to get updated streak
      const itemRes = await fetch(`/api/items/${notToDoId}`)
      let newStreak = 0
      if (itemRes.ok) {
        const itemData = await itemRes.json()
        newStreak = itemData.item?.streak || 0
      }

      const isMilestone =
        input.status === 'resisted' && [7, 14, 30, 60, 100].includes(newStreak)

      window.dispatchEvent(new Event('ntd-items-updated'))

      return { newStreak, isMilestone }
    },
    []
  )

  const getTodayCheckin = useCallback(
    (notToDoId: string): Checkin | null => {
      const today = new Date().toISOString().split('T')[0]
      return (
        checkins.find(
          (c) => c.notToDoId === notToDoId && c.date === today
        ) ?? null
      )
    },
    [checkins]
  )

  const getCheckinForDate = useCallback(
    (notToDoId: string, date: string): Checkin | null => {
      return (
        checkins.find(
          (c) => c.notToDoId === notToDoId && c.date === date
        ) ?? null
      )
    },
    [checkins]
  )

  const getCheckinsForItem = useCallback(
    (notToDoId: string): Checkin[] => {
      return checkins.filter((c) => c.notToDoId === notToDoId)
    },
    [checkins]
  )

  const getTodayResistCount = useCallback(
    (notToDoId: string): number => {
      const today = new Date().toISOString().split('T')[0]
      return (
        dailyResists.find(
          (r) => r.notToDoId === notToDoId && r.date === today
        )?.count ?? 0
      )
    },
    [dailyResists]
  )

  const refreshCheckins = useCallback(() => {
    // For API mode, we'd need to re-fetch from server
    // But checkins are loaded per-item in detail pages
  }, [])

  return {
    checkins,
    dailyResists,
    doCheckin,
    recordResist,
    getCheckinForDate,
    getTodayCheckin,
    getTodayResistCount,
    getCheckinsForItem,
    refreshCheckins,
  }
}
