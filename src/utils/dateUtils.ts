/**
 * Date and time utilities for live CleanConnect application
 * Uses local system clock (IST / user local timezone) instead of UTC slicing
 * to prevent off-by-one date bugs and stale timestamps.
 */

export function getLocalDateString(offsetDays = 0, baseDate = new Date()): string {
  const d = new Date(baseDate.getTime() + offsetDays * 86400000)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getFormattedToday(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Returns a contextual time-of-day greeting (Good morning / Good afternoon / Good evening)
 * based on the user's current local clock:
 * - 05:00 to 11:59: "Good morning"
 * - 12:00 to 16:59: "Good afternoon"
 * - 17:00 to 04:59: "Good evening"
 */
export function getTimeOfDayGreeting(date = new Date()): string {
  const hours = date.getHours()
  if (hours >= 5 && hours < 12) {
    return 'Good morning'
  }
  if (hours >= 12 && hours < 17) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
}

export function getCurrentMonthShort(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

export function getTomorrowDate(): string {
  return getLocalDateString(1)
}

/**
 * Returns the nearest upcoming 2-hour collection slot based on current local time
 */
export function getUpcomingTimeSlot(date = new Date()): string {
  const h = date.getHours()
  if (h < 10) return '08:00 – 10:00 AM'
  if (h < 12) return '10:00 AM – 12:00 PM'
  if (h < 16) return '02:00 – 04:00 PM'
  if (h < 18) return '04:00 – 06:00 PM'
  return '08:00 – 10:00 AM'
}

/**
 * Formats an ISO timestamp or Date into a clean local clock string (e.g., "10:45 AM")
 */
export function formatClockTime(input?: string | number | Date): string {
  const date = input ? new Date(input) : new Date()
  if (isNaN(date.getTime())) {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Converts a YYYY-MM-DD date string into a human-friendly label ("Today, 13 Oct", "Tomorrow, 14 Oct", etc.)
 */
export function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return 'Today'
  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)
  const yesterday = getLocalDateString(-1)

  if (dateStr === 'Today' || dateStr === today) {
    const d = new Date()
    return `Today, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }
  if (dateStr === 'Tomorrow' || dateStr === tomorrow) {
    const d = new Date(Date.now() + 86400000)
    return `Tomorrow, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }
  if (dateStr === yesterday) {
    const d = new Date(Date.now() - 86400000)
    return `Yesterday, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  // Parse YYYY-MM-DD in local time
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const y = Number(parts[0])
    const m = Number(parts[1]) - 1
    const day = Number(parts[2])
    const parsed = new Date(y, m, day)
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  }
  return dateStr
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Just now'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'Just now'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'Just now'

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago (${formatClockTime(date)})`
  if (diffDays === 1) return `Yesterday, ${formatClockTime(date)}`
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

/**
 * Generates an accurate, non-stale clearance estimate based on report creation time and status
 */
export function getDynamicClearanceEstimate(createdAtIso?: string, status?: string, etaMins = 35): string {
  if (status === 'Resolved') {
    return createdAtIso ? `Cleared (${formatClockTime(createdAtIso)})` : 'Cleared & Verified'
  }
  const createdMs = createdAtIso ? new Date(createdAtIso).getTime() : Date.now()
  const targetMs =
    !isNaN(createdMs) && createdMs + etaMins * 60000 > Date.now()
      ? createdMs + etaMins * 60000
      : Date.now() + 25 * 60000
  return `Today by ${formatClockTime(targetMs)} (~${etaMins} mins)`
}
