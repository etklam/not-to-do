'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import PushToggle from '@/components/PushToggle'

export default function AccountPage() {
  const t = useTranslations('auth')
  const { user, loading, login, register, logout, syncLocalData } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  if (loading) {
    return (
      <div className="px-5 pt-14 pb-24 flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, name)

      if (result.error) {
        setError(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSync = async () => {
    setSyncMessage('')
    const result = await syncLocalData()
    if (result.error) {
      if (result.error === 'No local data to sync') {
        setSyncMessage(t('syncNoData'))
      } else if (result.error.includes('already has data')) {
        setSyncMessage(t('syncAlreadyHasData'))
      } else {
        setSyncMessage(t('syncError'))
      }
    } else if (result.synced) {
      setSyncMessage(t('syncSuccess', { items: result.synced.items }))
    }
  }

  // Logged in view
  if (user) {
    return (
      <div className="px-5 pt-14 pb-24 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-kawaii-text mb-6">
          {t('account')}
        </h1>

        <div className="card-kawaii space-y-4">
          <p className="text-kawaii-text-light">
            {t('loggedInAs', { email: user.email })}
          </p>

          <button
            onClick={handleSync}
            className="w-full py-3 rounded-xl bg-kawaii-yellow-light text-kawaii-text font-medium border border-kawaii-yellow/30 active:scale-[0.98] transition-transform"
          >
            {t('syncData')}
          </button>

          {syncMessage && (
            <p className="text-sm text-center text-kawaii-text-light">{syncMessage}</p>
          )}

          <PushToggle />

          <button
            onClick={logout}
            className="w-full py-3 rounded-xl bg-kawaii-blush text-kawaii-text-light font-medium active:scale-[0.98] transition-transform"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    )
  }

  // Login/Register form
  return (
    <div className="px-5 pt-14 pb-24 animate-fade-in">
      <h1 className="text-2xl font-extrabold text-kawaii-text mb-2">
        {mode === 'login' ? t('loginTitle') : t('registerTitle')}
      </h1>
      <p className="text-kawaii-text-light text-sm mb-6">{t('saveProgressDesc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            required
            className="w-full px-4 py-3 rounded-kawaii-sm border border-kawaii-pink-light/50 bg-white text-kawaii-text placeholder:text-kawaii-text-light/60 focus:outline-none focus:ring-2 focus:ring-kawaii-pink/30"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-kawaii-sm border border-kawaii-pink-light/50 bg-white text-kawaii-text placeholder:text-kawaii-text-light/60 focus:outline-none focus:ring-2 focus:ring-kawaii-pink/30"
          />
        </div>

        {mode === 'register' && (
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('name')}
              className="w-full px-4 py-3 rounded-kawaii-sm border border-kawaii-pink-light/50 bg-white text-kawaii-text placeholder:text-kawaii-text-light/60 focus:outline-none focus:ring-2 focus:ring-kawaii-pink/30"
            />
          </div>
        )}

        {error && (
          <p className="text-kawaii-danger text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-kawaii-primary w-full disabled:opacity-50"
        >
          {submitting
            ? '...'
            : mode === 'login'
              ? t('login')
              : t('register')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
          }}
          className="text-sm text-kawaii-pink"
        >
          {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
          <span className="font-medium underline">
            {mode === 'login' ? t('register') : t('login')}
          </span>
        </button>
      </div>
    </div>
  )
}
