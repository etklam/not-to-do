'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface User {
  id: string
  email: string
  name: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  syncLocalData: () => Promise<{ error?: string; synced?: Record<string, number> }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error }
    setUser(data.user)
    return {}
  }, [])

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error }
      setUser(data.user)
      return {}
    },
    []
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const syncLocalData = useCallback(async () => {
    if (typeof window === 'undefined') return { error: 'Not in browser' }

    try {
      const items = JSON.parse(localStorage.getItem('ntd_items') || '[]')
      const checkins = JSON.parse(localStorage.getItem('ntd_checkins') || '[]')
      const dailyResists = JSON.parse(
        localStorage.getItem('ntd_daily_resists') || '[]'
      )

      if (items.length === 0) return { error: 'No local data to sync' }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, checkins, dailyResists }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.error }
      return { synced: data.synced }
    } catch {
      return { error: 'Failed to sync data' }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, syncLocalData }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
