'use client'

import Link from 'next/link'
import { useItems } from '@/lib/store'
import { formatDayLabel } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'

export default function ItemsPage() {
  const { items, loaded, archiveItem, restoreItem, deleteItem } = useItems()

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
          不做清單 📋
        </h1>
        <Link href="/items/new" className="btn-kawaii-primary !py-2 !px-4 text-sm">
          + 新增
        </Link>
      </div>

      {activeItems.length === 0 && archivedItems.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="清單還是空的"
          description="新增你想要戒掉的壞習慣，開始追蹤你的進展吧！"
          action={
            <Link href="/items/new" className="btn-kawaii-primary">
              來新增一個吧 ✨
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
                進行中 ({activeItems.length})
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
                            最佳 {formatDayLabel(item.bestStreak)}
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => archiveItem(item.id)}
                      className="text-xs text-kawaii-text-light hover:text-kawaii-danger transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-danger-light/50"
                    >
                      封存
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
                已封存 ({archivedItems.length})
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
                        最佳紀錄 {formatDayLabel(item.bestStreak)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreItem(item.id)}
                        className="text-xs text-kawaii-purple hover:text-kawaii-pink transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-purple-light/30"
                      >
                        恢復
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('確定要永久刪除嗎？這個動作無法復原。')) {
                            deleteItem(item.id)
                          }
                        }}
                        className="text-xs text-kawaii-text-light hover:text-kawaii-danger transition-colors px-2 py-1 rounded-kawaii-sm hover:bg-kawaii-danger-light/50"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
