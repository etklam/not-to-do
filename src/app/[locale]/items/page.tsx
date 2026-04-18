'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useItems } from '@/lib/unified-store'
import { formatDayLabel } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'

export default function ItemsPage() {
  const t = useTranslations('items')
  const tToast = useTranslations('toast')
  const { items, loaded, archiveItem, restoreItem, deleteItem } = useItems()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<{ id: string; title: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleArchive = useCallback((id: string) => {
    const item = items.find((it) => it.id === id)
    archiveItem(id)
    if (item) {
      setToast({ id, title: item.title })
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 5000)
    }
  }, [items, archiveItem])

  const handleUndo = useCallback(() => {
    if (toast) {
      restoreItem(toast.id)
      setToast(null)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [toast, restoreItem])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-float">🌸</div>
      </div>
    )
  }

  const activeItems = items.filter((it) => it.isActive)
  const archivedItems = items.filter((it) => !it.isActive)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-kawaii-text">
          {t('title')}
        </h1>
        <Link href="/items/new" className="btn-kawaii-primary !py-2 !px-4 text-sm">
          {t('add')}
        </Link>
      </div>

      {activeItems.length === 0 && archivedItems.length === 0 ? (
        <EmptyState
          emoji="📝"
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Link href="/items/new" className="btn-kawaii-primary">
              {t('emptyAction')}
            </Link>
          }
        />
      ) : (
        <>
          {/* Active items */}
          {activeItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-kawaii-text-light mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-kawaii-mint" />
                {t('sectionActive')} ({activeItems.length})
              </h2>
              <div className="flex flex-col gap-3">
                {activeItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="card-kawaii animate-slide-up flex items-center gap-3"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <Link
                      href={`/items/${item.id}`}
                      className="flex-1 min-w-0"
                    >
                      <h3 className="font-bold text-kawaii-text truncate hover:text-kawaii-pink transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-kawaii-text-light">
                          🔥 {formatDayLabel(item.streak)}
                        </span>
                        {item.bestStreak > item.streak && (
                          <span className="text-xs text-kawaii-purple">
                            {t('bestDay', { day: formatDayLabel(item.bestStreak) })}
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleArchive(item.id)}
                      className="text-xs text-kawaii-text-light hover:text-kawaii-danger transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-danger-light/50"
                    >
                      {t('archive')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archived items */}
          {archivedItems.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-kawaii-text-light mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-kawaii-text-light/40" />
                {t('sectionArchived')} ({archivedItems.length})
              </h2>
              <div className="flex flex-col gap-3">
                {archivedItems.map((item) => (
                  <div
                    key={item.id}
                    className="card-kawaii opacity-60 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-kawaii-text-light truncate line-through">
                        {item.title}
                      </h3>
                      <span className="text-xs text-kawaii-text-light">
                        {t('bestRecord', { day: formatDayLabel(item.bestStreak) })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreItem(item.id)}
                        className="text-xs text-kawaii-purple hover:text-kawaii-pink transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-purple-light/30"
                      >
                        {t('restore')}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item.id)}
                        className="text-xs text-kawaii-text-light hover:text-kawaii-danger transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-danger-light/50"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-kawaii-text/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-kawaii-lg p-6 max-w-sm w-full shadow-kawaii">
            <h3 className="text-lg font-extrabold text-kawaii-text mb-2">
              {t('deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-kawaii-text-light mb-5">
              {t('deleteConfirmDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-kawaii-secondary flex-1"
              >
                {t('deleteConfirmCancel')}
              </button>
              <button
                onClick={() => {
                  deleteItem(deleteTarget)
                  setDeleteTarget(null)
                }}
                className="btn-kawaii-danger flex-1"
              >
                {t('deleteConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className="flex items-center gap-3 bg-kawaii-text text-white rounded-pill px-5 py-3 shadow-kawaii text-sm font-semibold">
            <span>{tToast('archived')}</span>
            <button
              onClick={handleUndo}
              className="text-kawaii-mint font-bold hover:text-kawaii-mint/80 transition-colors"
            >
              {tToast('undo')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
