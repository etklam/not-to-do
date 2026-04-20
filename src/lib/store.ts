'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  NotToDoItem,
  Checkin,
  CheckinInput,
  DailyResistLog,
  ItemUpdates,
} from './types'
import { getTodayDateString, getYesterdayDateString } from './utils'
import { LEGACY_TRIGGER_MAP } from './insights'
import { MILESTONE_DAYS } from './messages'

const ITEMS_KEY = 'ntd_items'
const CHECKINS_KEY = 'ntd_checkins'
const RESISTS_KEY = 'ntd_daily_resists'
const SCHEMA_VERSION_KEY = 'ntd_schema_version'
const CURRENT_SCHEMA_VERSION = 5

interface LegacyItem {
  id: string
  title: string
  description?: string
  streak?: number
  resistCount?: number
  bestStreak?: number
  bestResistCount?: number
  lastCheckin?: string | null
  isActive?: boolean
  mode?: 'personal' | 'challenge'
  challengeId?: string | null
  createdAt: string
}

interface LegacyCheckin {
  id: string
  notToDoId: string
  date: string
  status: Checkin['status']
  resistCount?: number
  temptationLevel?: Checkin['temptationLevel']
  triggerTags?: string[]
  note?: string
  createdAt: string
}

function getStoredItems(): NotToDoItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getStoredCheckins(): Checkin[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHECKINS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getStoredDailyResists(): DailyResistLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RESISTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveItems(items: NotToDoItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
}

function saveCheckins(checkins: Checkin[]) {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins))
  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
}

function saveDailyResists(resists: DailyResistLog[]) {
  localStorage.setItem(RESISTS_KEY, JSON.stringify(resists))
  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
}

function notifyItemsUpdated() {
  window.dispatchEvent(new Event('ntd-items-updated'))
}

// Migrate old schema (resistCount-only items) to new schema (streak)
function migrateItems(items: LegacyItem[]): NotToDoItem[] {
  return items.map((it) => ({
    id: it.id,
    title: it.title,
    description: it.description ?? '',
    streak: it.streak ?? it.resistCount ?? 0,
    bestStreak: it.bestStreak ?? it.bestResistCount ?? it.streak ?? it.resistCount ?? 0,
    lastCheckin: it.lastCheckin ?? null,
    isActive: it.isActive ?? true,
    mode: it.mode ?? 'personal',
    challengeId: it.challengeId ?? null,
    createdAt: it.createdAt,
  }))
}

function migrateTriggerTags(tags: string[]): string[] {
  return tags.map((tag) => LEGACY_TRIGGER_MAP[tag] ?? tag)
}

function migrateCheckins(checkins: LegacyCheckin[]): Checkin[] {
  return checkins.map((c) => ({
    id: c.id,
    notToDoId: c.notToDoId,
    date: c.date,
    status: c.status,
    resistCount: c.resistCount ?? (c.status === 'resisted' ? 1 : 0),
    temptationLevel: c.temptationLevel ?? null,
    triggerTags: migrateTriggerTags(c.triggerTags ?? []),
    note: c.note ?? '',
    createdAt: c.createdAt,
  }))
}

function migrateDailyResists(checkins: LegacyCheckin[]): DailyResistLog[] {
  return checkins
    .map((checkin) => {
      const count = checkin.resistCount ?? (checkin.status === 'resisted' ? 1 : 0)
      if (count <= 0) return null

      return {
        id: uuidv4(),
        notToDoId: checkin.notToDoId,
        date: checkin.date,
        count,
        createdAt: checkin.createdAt,
        updatedAt: checkin.createdAt,
      }
    })
    .filter((resist): resist is DailyResistLog => resist !== null)
}

function getStreakEndingOnDate(
  notToDoId: string,
  date: string,
  checkins: Checkin[]
): number {
  let streak = 0
  let cursor = date

  while (true) {
    const matchingCheckin = checkins.find(
      (checkin) => checkin.notToDoId === notToDoId && checkin.date === cursor
    )

    if (matchingCheckin?.status !== 'resisted') {
      return streak
    }

    streak += 1
    cursor = getYesterdayDateString(cursor)
  }
}

// ─── Items Hook ───

export function useItems() {
  const [items, setItems] = useState<NotToDoItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let storedItems = getStoredItems()
    const version = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || '0')

    if (version < CURRENT_SCHEMA_VERSION) {
      storedItems = migrateItems(storedItems)
      const storedCheckins = getStoredCheckins()
      saveItems(storedItems)
      saveCheckins(migrateCheckins(storedCheckins))
      saveDailyResists(migrateDailyResists(storedCheckins))
    }

    setItems(storedItems)
    setLoaded(true)
  }, [])

  const persist = useCallback((next: NotToDoItem[]) => {
    setItems(next)
    saveItems(next)
    notifyItemsUpdated()
  }, [])

  const addItem = useCallback(
    (title: string, description: string) => {
      const item: NotToDoItem = {
        id: uuidv4(),
        title,
        description,
        streak: 0,
        bestStreak: 0,
        lastCheckin: null,
        isActive: true,
        mode: 'personal',
        challengeId: null,
        createdAt: new Date().toISOString(),
      }
      const next = [...getStoredItems(), item]
      persist(next)
      return item
    },
    [persist]
  )

  const archiveItem = useCallback(
    (id: string) => {
      const next = getStoredItems().map((it) =>
        it.id === id ? { ...it, isActive: false } : it
      )
      persist(next)
    },
    [persist]
  )

  const deleteItem = useCallback(
    (id: string) => {
      const next = getStoredItems().filter((it) => it.id !== id)
      persist(next)
      const checkins = getStoredCheckins().filter((c) => c.notToDoId !== id)
      saveCheckins(checkins)
      const resists = getStoredDailyResists().filter((r) => r.notToDoId !== id)
      saveDailyResists(resists)
    },
    [persist]
  )

  const restoreItem = useCallback(
    (id: string) => {
      const next = getStoredItems().map((it) =>
        it.id === id ? { ...it, isActive: true } : it
      )
      persist(next)
    },
    [persist]
  )

  const getItem = useCallback(
    (id: string) => items.find((it) => it.id === id) ?? null,
    [items]
  )

  const updateItem = useCallback(
    (id: string, updates: ItemUpdates) => {
      let updatedItem: NotToDoItem | null = null
      const next = getStoredItems().map((it) => {
        if (it.id !== id) return it

        const nextItem: NotToDoItem = {
          ...it,
          ...updates,
          title: updates.title !== undefined ? updates.title.trim() : it.title,
          description:
            updates.description !== undefined
              ? updates.description.trim()
              : it.description,
        }

        updatedItem = nextItem
        return nextItem
      })

      persist(next)
      return updatedItem
    },
    [persist]
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

// ─── Check-in Hook ───

export function useCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [dailyResists, setDailyResists] = useState<DailyResistLog[]>([])

  useEffect(() => {
    const version = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || '0')
    let storedCheckins = getStoredCheckins()
    let storedResists = getStoredDailyResists()
    if (version < CURRENT_SCHEMA_VERSION) {
      storedCheckins = migrateCheckins(storedCheckins)
      storedResists = migrateDailyResists(storedCheckins)
      saveCheckins(storedCheckins)
      saveDailyResists(storedResists)
    }
    setCheckins(storedCheckins)
    setDailyResists(storedResists)
  }, [])

  const recordResist = useCallback((notToDoId: string): number => {
    const today = getTodayDateString()
    const now = new Date().toISOString()
    let allResists = getStoredDailyResists()
    let allCheckins = getStoredCheckins()

    const existingToday = allResists.find(
      (resist) => resist.notToDoId === notToDoId && resist.date === today
    )

    let nextCount = 1

    if (existingToday) {
      nextCount = existingToday.count + 1
      allResists = allResists.map((resist) =>
        resist.notToDoId === notToDoId && resist.date === today
          ? { ...resist, count: nextCount, updatedAt: now }
          : resist
      )
    } else {
      allResists.push({
        id: uuidv4(),
        notToDoId,
        date: today,
        count: 1,
        createdAt: now,
        updatedAt: now,
      })
    }

    saveDailyResists(allResists)
    setDailyResists(allResists)

    const hasTodayCheckin = allCheckins.some(
      (checkin) => checkin.notToDoId === notToDoId && checkin.date === today
    )

    if (hasTodayCheckin) {
      allCheckins = allCheckins.map((checkin) =>
        checkin.notToDoId === notToDoId && checkin.date === today
          ? { ...checkin, resistCount: nextCount }
          : checkin
      )
      saveCheckins(allCheckins)
      setCheckins(allCheckins)
    }

    return nextCount
  }, [])

  const doCheckin = useCallback(
    (
      notToDoId: string,
      input: CheckinInput
    ): { newStreak: number; isMilestone: boolean } => {
      const today = getTodayDateString()
      const yesterday = getYesterdayDateString(today)
      const targetDate = input.status === 'resisted' ? yesterday : today
      const allCheckins = getStoredCheckins()
      const allResists = getStoredDailyResists()
      const items = getStoredItems()
      const item = items.find((it) => it.id === notToDoId)
      const status = input.status
      const todayResistCount =
        allResists.find(
          (resist) => resist.notToDoId === notToDoId && resist.date === today
        )?.count ?? 0

      const existingForTargetDate = allCheckins.find(
        (c) => c.notToDoId === notToDoId && c.date === targetDate
      )
      const todayFailed = allCheckins.find(
        (c) => c.notToDoId === notToDoId && c.date === today && c.status === 'failed'
      )

      if (!item) return { newStreak: 0, isMilestone: false }

      if (existingForTargetDate) {
        if (existingForTargetDate.status === 'resisted' && status === 'failed') {
          const updatedCheckins = allCheckins.map((checkin) =>
            checkin.notToDoId === notToDoId && checkin.date === today
              ? {
                  ...checkin,
                  status: 'failed' as const,
                  resistCount: todayResistCount,
                  temptationLevel: null,
                  triggerTags: input.triggerTags,
                  note: input.note,
                }
              : checkin
          )

          saveCheckins(updatedCheckins)
          setCheckins(updatedCheckins)

          const updatedItems = items.map((it) =>
            it.id === notToDoId
              ? { ...it, streak: 0, lastCheckin: today }
              : it
          )
          saveItems(updatedItems)

          window.dispatchEvent(new Event('ntd-items-updated'))

          return { newStreak: 0, isMilestone: false }
        }

        return { newStreak: item.streak, isMilestone: false }
      }

      if (status === 'resisted') {
        allCheckins.push({
          id: uuidv4(),
          notToDoId,
          date: yesterday,
          status: 'resisted',
          resistCount: 0,
          temptationLevel: input.temptationLevel,
          triggerTags: input.triggerTags,
          note: input.note,
          createdAt: new Date().toISOString(),
        })
      } else {
        allCheckins.push({
          id: uuidv4(),
          notToDoId,
          date: today,
          status: 'failed',
          resistCount: todayResistCount,
          temptationLevel: null,
          triggerTags: input.triggerTags,
          note: input.note,
          createdAt: new Date().toISOString(),
        })
      }

      saveCheckins(allCheckins)
      setCheckins(allCheckins)

      let newStreak: number
      if (status === 'failed') {
        newStreak = 0
      } else {
        const streakThroughYesterday = getStreakEndingOnDate(
          notToDoId,
          yesterday,
          allCheckins
        )
        newStreak = todayFailed ? 0 : streakThroughYesterday
      }

      const streakForBest =
        status === 'resisted'
          ? getStreakEndingOnDate(notToDoId, yesterday, allCheckins)
          : item.bestStreak
      const newBest = Math.max(item.bestStreak, streakForBest)
      const isMilestone =
        status === 'resisted' && MILESTONE_DAYS.includes(newStreak)
      const nextLastCheckin =
        item.lastCheckin && item.lastCheckin > targetDate
          ? item.lastCheckin
          : targetDate

      const updatedItems = items.map((it) =>
        it.id === notToDoId
          ? {
              ...it,
              streak: newStreak,
              bestStreak: newBest,
              lastCheckin: nextLastCheckin,
            }
          : it
      )
      saveItems(updatedItems)

      window.dispatchEvent(new Event('ntd-items-updated'))

      return { newStreak, isMilestone }
    },
    []
  )

  const getTodayCheckin = useCallback(
    (notToDoId: string): Checkin | null => {
      const today = getTodayDateString()
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
          (checkin) => checkin.notToDoId === notToDoId && checkin.date === date
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
      const today = getTodayDateString()
      return (
        dailyResists.find(
          (resist) => resist.notToDoId === notToDoId && resist.date === today
        )?.count ?? 0
      )
    },
    [dailyResists]
  )

  const refreshCheckins = useCallback(() => {
    setCheckins(getStoredCheckins())
    setDailyResists(getStoredDailyResists())
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
