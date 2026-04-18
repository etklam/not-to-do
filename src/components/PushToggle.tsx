'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushToggle() {
  const t = useTranslations('push')
  const { user } = useAuth()
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  if (!user || !supported) return null

  const handleToggle = async () => {
    setLoading(true)
    setError('')

    try {
      if (subscribed) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        await fetch('/api/push/subscribe', { method: 'DELETE' })
        setSubscribed(false)
      } else {
        // Register service worker + subscribe
        const reg = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setError(t('permissionDenied'))
          setLoading(false)
          return
        }

        if (!VAPID_PUBLIC_KEY) {
          // No VAPID key configured — just register the service worker
          setSubscribed(true)
          setLoading(false)
          return
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })

        setSubscribed(true)
      }
    } catch {
      setError(t('notSupported'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-medium transition-all active:scale-[0.98] ${
          subscribed
            ? 'bg-kawaii-mint/10 text-kawaii-mint border border-kawaii-mint/30'
            : 'bg-kawaii-purple-light text-kawaii-purple border border-kawaii-purple/20'
        } disabled:opacity-50`}
      >
        {loading ? '...' : subscribed ? t('enabled') : t('enable')}
      </button>
      {error && <p className="text-sm text-kawaii-danger text-center">{error}</p>}
    </div>
  )
}
