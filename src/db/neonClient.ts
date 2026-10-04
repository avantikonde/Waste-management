import { neon } from '@neondatabase/serverless'
import type {
  StoredReport,
  StoredPickup,
  StoredUser,
  EcoReward,
  NotificationItem,
  PickupStatus,
} from '../types'

const rawDbUrl = (import.meta.env.VITE_DATABASE_URL as string | undefined) || ''

export const isNeonConfigured = Boolean(
  rawDbUrl &&
    rawDbUrl.startsWith('postgres') &&
    !rawDbUrl.includes('username:password') &&
    !rawDbUrl.includes('ep-your-id')
)

// Lazy instantiation
let sqlInstance: ReturnType<typeof neon> | null = null

export function getSql() {
  if (!isNeonConfigured) return null
  if (!sqlInstance) {
    try {
      sqlInstance = neon(rawDbUrl)
    } catch (err) {
      console.error('Failed to initialize Neon client:', err)
      return null
    }
  }
  return sqlInstance
}

export async function checkNeonConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const sql = getSql()
  if (!sql) return { connected: false, error: 'Database URL not configured' }

  const start = performance.now()
  try {
    const res = (await sql`SELECT 1 as ping;`) as unknown as Record<string, unknown>[]
    const latencyMs = Math.round(performance.now() - start)
    return { connected: Boolean(res && res.length > 0), latencyMs }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { connected: false, error: message }
  }
}

// ----------------------------------------------------
// Reports
// ----------------------------------------------------
function mapRowToReport(row: Record<string, unknown>): StoredReport {
  return {
    id: String(row.id),
    type: String(row.type || 'Waste report'),
    category: row.category as StoredReport['category'],
    location: String(row.location || ''),
    addressDetails: row.address_details ? String(row.address_details) : undefined,
    lat: Number(row.lat) || 18.5204,
    lng: Number(row.lng) || 73.8567,
    status: (row.status as StoredReport['status']) || 'Submitted',
    priority: (row.priority as StoredReport['priority']) || 'Medium',
    time: row.time ? String(row.time) : undefined,
    icon: String(row.icon || 'WA'),
    description: row.description ? String(row.description) : undefined,
    image: row.image ? String(row.image) : undefined,
    proofImage: row.proof_image ? String(row.proof_image) : undefined,
    assignedDriver: row.assigned_driver ? String(row.assigned_driver) : undefined,
    vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : undefined,
    driverPhone: row.driver_phone ? String(row.driver_phone) : undefined,
    reporterName: row.reporter_name ? String(row.reporter_name) : undefined,
    reporterEmail: row.reporter_email ? String(row.reporter_email) : undefined,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
    estimatedClearance: row.estimated_clearance ? String(row.estimated_clearance) : undefined,
    greenPointsAwarded: Number(row.green_points_awarded) || 50,
  }
}

export async function fetchNeonReports(): Promise<StoredReport[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    const rows = (await sql`SELECT * FROM reports ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => mapRowToReport(r))
  } catch (err) {
    console.error('Neon: error fetching reports:', err)
    return []
  }
}

export async function insertNeonReport(report: StoredReport): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`
      INSERT INTO reports (
        id, type, category, location, address_details, lat, lng,
        status, priority, time, icon, description, image,
        reporter_name, reporter_email, created_at, green_points_awarded,
        assigned_driver, vehicle_number, driver_phone, estimated_clearance
      ) VALUES (
        ${report.id}, ${report.type}, ${report.category}, ${report.location},
        ${report.addressDetails || null}, ${report.lat || 18.5204}, ${report.lng || 73.8567},
        ${report.status}, ${report.priority}, ${report.time || 'Just now'}, ${report.icon},
        ${report.description || null}, ${report.image || null},
        ${report.reporterName || 'Citizen User'}, ${report.reporterEmail || null},
        ${report.createdAt}, ${report.greenPointsAwarded || 50},
        ${report.assignedDriver || null}, ${report.vehicleNumber || null},
        ${report.driverPhone || null}, ${report.estimatedClearance || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        assigned_driver = EXCLUDED.assigned_driver,
        vehicle_number = EXCLUDED.vehicle_number,
        driver_phone = EXCLUDED.driver_phone;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting report:', err)
    return false
  }
}

export async function updateNeonReport(id: string, partial: Partial<StoredReport>): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    if (partial.status && partial.assignedDriver) {
      await sql`
        UPDATE reports
        SET status = ${partial.status}, assigned_driver = ${partial.assignedDriver}, vehicle_number = ${partial.vehicleNumber || null}
        WHERE id = ${id};
      `
    } else if (partial.status) {
      await sql`
        UPDATE reports
        SET status = ${partial.status}
        WHERE id = ${id};
      `
    }
    return true
  } catch (err) {
    console.error('Neon: error updating report:', err)
    return false
  }
}

export async function deleteNeonReport(id: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`DELETE FROM reports WHERE id = ${id};`
    return true
  } catch (err) {
    console.error('Neon: error deleting report:', err)
    return false
  }
}

export async function clearAllNeonReports(): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`DELETE FROM reports;`
    return true
  } catch (err) {
    console.error('Neon: error clearing reports:', err)
    return false
  }
}

// ----------------------------------------------------
// Pickups
// ----------------------------------------------------
function mapRowToPickup(row: Record<string, unknown>): StoredPickup {
  return {
    id: String(row.id),
    type: String(row.type || 'Pickup'),
    address: String(row.address || ''),
    contact: String(row.contact || '+91 98230 11223'),
    status: (row.status as PickupStatus) || 'Requested',
    date: String(row.date || 'Today'),
    timeSlot: String(row.time_slot || '10:00 AM'),
    quantity: String(row.quantity || '10-25 kg'),
    instructions: row.instructions ? String(row.instructions) : undefined,
    driverName: row.driver_name ? String(row.driver_name) : undefined,
    vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : undefined,
    etaMinutes: row.eta_minutes ? Number(row.eta_minutes) : undefined,
    lat: row.lat ? Number(row.lat) : undefined,
    lng: row.lng ? Number(row.lng) : undefined,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  }
}

export async function fetchNeonPickups(): Promise<StoredPickup[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    const rows = (await sql`SELECT * FROM pickups ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => mapRowToPickup(r))
  } catch (err) {
    console.error('Neon: error fetching pickups:', err)
    return []
  }
}

export async function insertNeonPickup(pickup: StoredPickup): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`
      INSERT INTO pickups (
        id, type, address, date, time_slot, status, quantity, instructions,
        driver_name, vehicle_number, eta_minutes, lat, lng, contact, created_at
      ) VALUES (
        ${pickup.id}, ${pickup.type}, ${pickup.address}, ${pickup.date},
        ${pickup.timeSlot}, ${pickup.status}, ${pickup.quantity},
        ${pickup.instructions || null}, ${pickup.driverName || null},
        ${pickup.vehicleNumber || null}, ${pickup.etaMinutes || null},
        ${pickup.lat || null}, ${pickup.lng || null}, ${pickup.contact || '+91 98230 11223'},
        ${pickup.createdAt}
      )
      ON CONFLICT (id) DO NOTHING;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting pickup:', err)
    return false
  }
}

// ----------------------------------------------------
// Users
// ----------------------------------------------------
export async function fetchNeonUsers(): Promise<StoredUser[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    const rows = (await sql`SELECT * FROM users ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      name: String(r.name),
      email: String(r.email),
      password: '',
      role: (r.role as StoredUser['role']) || 'Citizen',
      createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
      city: r.ward ? String(r.ward) : 'Pune',
    }))
  } catch (err) {
    console.error('Neon: error fetching users:', err)
    return []
  }
}

export async function insertNeonUser(user: StoredUser): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    const userId = `USR-${Date.now()}`
    await sql`
      INSERT INTO users (id, name, email, role, ward, created_at)
      VALUES (
        ${userId}, ${user.name}, ${user.email}, ${user.role || 'Citizen'},
        ${user.city || 'Pune'}, ${user.createdAt || new Date().toISOString()}
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        ward = EXCLUDED.ward;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting user:', err)
    return false
  }
}

export async function updateNeonUserProfile(email: string, name: string, city?: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`
      UPDATE users
      SET name = ${name}, ward = ${city || 'Pune'}
      WHERE email = ${email};
    `
    return true
  } catch (err) {
    console.error('Neon: error updating user profile:', err)
    return false
  }
}

// ----------------------------------------------------
// Rewards
// ----------------------------------------------------
export async function fetchNeonRewards(): Promise<EcoReward[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    const rows = (await sql`SELECT * FROM rewards ORDER BY points_cost ASC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      category: r.category as EcoReward['category'],
      pointsCost: Number(r.points_cost),
      icon: String(r.icon || 'Award'),
      description: String(r.description || ''),
      code: r.code ? String(r.code) : undefined,
      claimed: Boolean(r.claimed),
    }))
  } catch (err) {
    console.error('Neon: error fetching rewards:', err)
    return []
  }
}

export async function updateNeonRewardClaimed(id: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`UPDATE rewards SET claimed = TRUE WHERE id = ${id};`
    return true
  } catch (err) {
    console.error('Neon: error claiming reward:', err)
    return false
  }
}

// ----------------------------------------------------
// Notifications
// ----------------------------------------------------
export async function fetchNeonNotifications(): Promise<NotificationItem[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    const rows = (await sql`SELECT * FROM notifications ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      message: String(r.message),
      time: String(r.time || 'Just now'),
      read: Boolean(r.read),
      type: (r.type as NotificationItem['type']) || 'system',
    }))
  } catch (err) {
    console.error('Neon: error fetching notifications:', err)
    return []
  }
}

export async function insertNeonNotification(n: NotificationItem): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`
      INSERT INTO notifications (id, title, message, time, read, type, created_at)
      VALUES (${n.id}, ${n.title}, ${n.message}, ${n.time}, ${n.read}, ${n.type}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting notification:', err)
    return false
  }
}
