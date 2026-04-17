'use client'

interface EmptyStateProps {
  emoji?: string
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({
  emoji = '🌸',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <span className="text-6xl mb-4 animate-float">{emoji}</span>
      <h2 className="text-xl font-bold text-kawaii-text mb-2">{title}</h2>
      <p className="text-sm text-kawaii-text-light max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action}
    </div>
  )
}
