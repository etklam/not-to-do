export interface NotToDoItem {
  id: string
  title: string
  description: string
  streak: number // 目前 Day 序號（以昨天為止；若今天破戒則歸零）
  bestStreak: number // 最佳 Day 序號
  lastCheckin: string | null // 最近一次記錄到的日期，YYYY-MM-DD
  isActive: boolean
  mode: 'personal' | 'challenge'
  challengeId: string | null
  createdAt: string // ISO timestamp
}

export interface ItemUpdates {
  title?: string
  description?: string
  streak?: number
  bestStreak?: number
  lastCheckin?: string | null
  isActive?: boolean
  mode?: 'personal' | 'challenge'
  challengeId?: string | null
}

export type CheckinStatus = 'resisted' | 'failed'

export type TemptationLevel = 'none' | 'some' | 'many'

export interface Checkin {
  id: string
  notToDoId: string
  date: string // YYYY-MM-DD
  status: CheckinStatus
  resistCount: number // 舊資料相容欄位；失敗記錄會同步當日忍住次數快照
  temptationLevel: TemptationLevel | null
  triggerTags: string[]
  note: string
  createdAt: string // ISO timestamp
}

export interface CheckinInput {
  status: CheckinStatus
  temptationLevel: TemptationLevel | null
  triggerTags: string[]
  note: string
}

export interface DailyResistLog {
  id: string
  notToDoId: string
  date: string // YYYY-MM-DD
  count: number
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
