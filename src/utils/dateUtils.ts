/**
 * Date and time utilities for live CleanConnect application
 */

export function getFormattedToday(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
}

export function getCurrentMonthShort(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

export function getTomorrowDate(): string {
  const tomorrow = new Date(Date.now() + 86400000)
  return tomorrow.toISOString().split('T')[0]
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Just now'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'Recently'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'Just now'

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatFullDateTime(isoString?: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
