'use client'

import { useAuth } from './auth-context'
import { useItems as useLocalItems, useCheckins as useLocalCheckins } from './store'
import { useApiItems, useApiCheckins } from './api-store'
import { useCallback, useMemo } from 'react'
import type { CheckinInput, ItemUpdates } from './types'

// Unified hooks that switch between localStorage (anonymous) and API (logged in)
// Wraps sync localStorage functions to match async API signatures

export function useItems() {
  const { user, loading: authLoading } = useAuth()
  const local = useLocalItems()
  const api = useApiItems()

  const isApi = !authLoading && !!user

  // Wrap local addItem to always return a Promise
  const addItem = useCallback(
    async (title: string, description: string) => {
      if (isApi) return api.addItem(title, description)
      return local.addItem(title, description)
    },
    [isApi, api, local]
  )

  const archiveItem = useCallback(
    async (id: string) => {
      if (isApi) return api.archiveItem(id)
      return local.archiveItem(id)
    },
    [isApi, api, local]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      if (isApi) return api.deleteItem(id)
      return local.deleteItem(id)
    },
    [isApi, api, local]
  )

  const restoreItem = useCallback(
    async (id: string) => {
      if (isApi) return api.restoreItem(id)
      return local.restoreItem(id)
    },
    [isApi, api, local]
  )

  const updateItem = useCallback(
    async (id: string, updates: ItemUpdates) => {
      if (isApi) return api.updateItem(id, updates)
      return local.updateItem(id, updates)
    },
    [isApi, api, local]
  )

  const source = isApi ? api : local

  return useMemo(
    () => ({
      items: source.items,
      loaded: source.loaded,
      addItem,
      archiveItem,
      deleteItem,
      restoreItem,
      updateItem,
      getItem: source.getItem,
    }),
    [
      source.items,
      source.loaded,
      addItem,
      archiveItem,
      deleteItem,
      restoreItem,
      updateItem,
      source.getItem,
    ]
  )
}

export function useCheckins() {
  const { user, loading: authLoading } = useAuth()
  const local = useLocalCheckins()
  const api = useApiCheckins()

  const isApi = !authLoading && !!user

  const doCheckin = useCallback(
    async (
      notToDoId: string,
      input: CheckinInput
    ): Promise<{ newStreak: number; isMilestone: boolean }> => {
      if (isApi) return api.doCheckin(notToDoId, input)
      return local.doCheckin(notToDoId, input)
    },
    [isApi, api, local]
  )

  const recordResist = useCallback(
    async (notToDoId: string): Promise<number> => {
      if (isApi) return api.recordResist(notToDoId)
      return local.recordResist(notToDoId)
    },
    [isApi, api, local]
  )

  const source = isApi ? api : local

  return useMemo(
    () => ({
      checkins: source.checkins,
      dailyResists: source.dailyResists,
      doCheckin,
      recordResist,
      getCheckinForDate: source.getCheckinForDate,
      getTodayCheckin: source.getTodayCheckin,
      getTodayResistCount: source.getTodayResistCount,
      getCheckinsForItem: source.getCheckinsForItem,
      refreshCheckins: source.refreshCheckins,
    }),
    [source, doCheckin, recordResist]
  )
}
