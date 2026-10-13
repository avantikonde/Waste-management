import { neon } from '@neondatabase/serverless'
import type {
  StoredReport,
  StoredPickup,
  StoredUser,
  EcoReward,
  NotificationItem,
  PickupStatus,
  DriverAssignment,
  DriverAvailabilitySlot,
  DriverProfile,
  WasteCategory,
} from '../types'
import { getLocalDateString } from '../utils/dateUtils'

const rawDbUrl = (import.meta.env.VITE_DATABASE_URL as string | undefined) || ''

export const isNeonConfigured = Boolean(
  rawDbUrl &&
    rawDbUrl.startsWith('postgres') &&
    !rawDbUrl.includes('username:password') &&
    !rawDbUrl.includes('ep-your-id')
)

// Lazy instantiation
let sqlInstance: ReturnType<typeof neon> | null = null
let schemaMigrationPromise: Promise<void> | null = null

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

/**
 * Self-healing schema migration that ensures all required columns and tables exist
 * in Neon PostgreSQL and repairs legacy seed rows with outdated categories/statuses/dates.
 */
export async function ensureNeonSchema(): Promise<void> {
  const sql = getSql()
  if (!sql) return
  if (schemaMigrationPromise) return schemaMigrationPromise

  schemaMigrationPromise = (async () => {
    try {
      // 1. Ensure reports columns exist
      await sql`
        CREATE TABLE IF NOT EXISTS reports (
          id VARCHAR(64) PRIMARY KEY,
          type VARCHAR(128) NOT NULL,
          category VARCHAR(128) NOT NULL,
          location VARCHAR(255) NOT NULL,
          address_details TEXT,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          status VARCHAR(64) NOT NULL DEFAULT 'Submitted',
          priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
          time VARCHAR(64),
          icon VARCHAR(16),
          description TEXT,
          image TEXT,
          proof_image TEXT,
          reporter_name VARCHAR(255),
          reporter_email VARCHAR(255),
          citizen_phone VARCHAR(64),
          reporter_phone VARCHAR(64),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          green_points_awarded INT DEFAULT 50,
          assigned_driver VARCHAR(255),
          vehicle_number VARCHAR(64),
          driver_phone VARCHAR(64),
          estimated_clearance VARCHAR(64)
        );
      `
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS citizen_phone VARCHAR(64);`
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_phone VARCHAR(64);`
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_image TEXT;`

      // 2. Ensure pickups columns exist
      await sql`
        CREATE TABLE IF NOT EXISTS pickups (
          id VARCHAR(64) PRIMARY KEY,
          type VARCHAR(128) NOT NULL,
          address VARCHAR(255) NOT NULL,
          contact VARCHAR(64),
          date VARCHAR(64) NOT NULL,
          time_slot VARCHAR(64) NOT NULL,
          status VARCHAR(64) NOT NULL DEFAULT 'Accepted',
          quantity VARCHAR(64) NOT NULL DEFAULT '10-25 kg',
          instructions TEXT,
          driver_name VARCHAR(255),
          vehicle_number VARCHAR(64),
          driver_phone VARCHAR(64),
          availability_slot_id VARCHAR(64),
          eta_minutes INT,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS contact VARCHAR(64);`
      await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
      await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS availability_slot_id VARCHAR(64);`

      // 3. Ensure users columns exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) DEFAULT 'password123',
          role VARCHAR(32) NOT NULL DEFAULT 'Citizen',
          ward VARCHAR(128),
          city VARCHAR(128) DEFAULT 'Pune',
          green_points INT DEFAULT 1240,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'password123';`
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(128) DEFAULT 'Pune';`
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS green_points INT DEFAULT 1240;`

      // 4. Ensure driver_assignments table & columns exist
      await sql`
        CREATE TABLE IF NOT EXISTS driver_assignments (
          id VARCHAR(64) PRIMARY KEY,
          report_id VARCHAR(64) NOT NULL,
          type VARCHAR(128) NOT NULL,
          location VARCHAR(255) NOT NULL,
          priority VARCHAR(32) NOT NULL,
          status VARCHAR(64) NOT NULL DEFAULT 'New',
          time_slot VARCHAR(64) NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          distance_km DOUBLE PRECISION,
          proof_image TEXT,
          driver_name VARCHAR(255),
          driver_phone VARCHAR(64),
          vehicle_number VARCHAR(64),
          citizen_phone VARCHAR(64),
          report_image TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);`
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(64);`
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS citizen_phone VARCHAR(64);`
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS report_image TEXT;`
      await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`

      // 5. Ensure driver_availability table exists
      await sql`
        CREATE TABLE IF NOT EXISTS driver_availability (
          id VARCHAR(64) PRIMARY KEY,
          driver_id VARCHAR(64) NOT NULL,
          driver_name VARCHAR(255) NOT NULL,
          driver_phone VARCHAR(64) NOT NULL,
          vehicle_number VARCHAR(64) NOT NULL,
          vehicle_type VARCHAR(128) NOT NULL,
          date VARCHAR(64) NOT NULL,
          time_slot VARCHAR(64) NOT NULL,
          location VARCHAR(255) NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          is_booked BOOLEAN DEFAULT FALSE,
          booked_by_pickup_id VARCHAR(64),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      // 6. Ensure driver_profile table exists
      await sql`
        CREATE TABLE IF NOT EXISTS driver_profile (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(64) NOT NULL,
          vehicle_number VARCHAR(64) NOT NULL,
          vehicle_type VARCHAR(128) NOT NULL,
          zone VARCHAR(255) NOT NULL,
          depot VARCHAR(255) NOT NULL,
          status VARCHAR(64) NOT NULL DEFAULT 'On Duty',
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      // 7. Clean up legacy v1 seed records with invalid categories/statuses/dates
      await sql`
        DELETE FROM reports
        WHERE id IN ('CW-2026-008492', 'CW-2026-008441', 'CW-2026-008390', 'CW-2026-008210');
      `
      await sql`
        DELETE FROM pickups
        WHERE id IN ('PK-2026-004098');
      `
      await sql`
        UPDATE pickups
        SET status = 'En route',
            date = ${getLocalDateString(0)},
            time_slot = '08:00 – 10:00 AM',
            driver_name = COALESCE(driver_name, 'Ravi Kumar'),
            driver_phone = COALESCE(driver_phone, '+91 98220 44123'),
            contact = COALESCE(contact, '+91 98220 12345')
        WHERE status = 'Confirmed' OR id = 'PK-2026-004120';
      `
      await sql`
        UPDATE rewards SET category = 'Rebate' WHERE category = 'Voucher';
      `
      await sql`
        UPDATE rewards SET category = 'Eco Gear' WHERE category = 'Product';
      `
    } catch (err) {
      console.warn('Neon schema migration warning:', err)
    }
  })()

  return schemaMigrationPromise
}

export async function checkNeonConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const sql = getSql()
  if (!sql) return { connected: false, error: 'Database URL not configured' }

  const start = performance.now()
  try {
    await ensureNeonSchema()
    const res = (await sql`SELECT 1 as ping;`) as unknown as Record<string, unknown>[]
    const latencyMs = Math.round(performance.now() - start)
    return { connected: Boolean(res && res.length > 0), latencyMs }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { connected: false, error: message }
  }
}

function normalizeWasteCategory(raw: unknown): WasteCategory {
  const str = String(raw || '').trim()
  if (str === 'Plastic & packaging') return 'Plastic & packaging'
  if (str === 'Organic waste' || str.toLowerCase().includes('organic')) return 'Organic waste'
  if (str === 'Construction debris' || str.toLowerCase().includes('construction')) return 'Construction debris'
  if (str === 'Electronic / E-waste' || str.toLowerCase().includes('e-waste') || str.toLowerCase().includes('electronic')) {
    return 'Electronic / E-waste'
  }
  if (str === 'Hazardous waste' || str.toLowerCase().includes('hazardous')) return 'Hazardous waste'
  return 'Mixed waste'
}

// ----------------------------------------------------
// Reports
// ----------------------------------------------------
function mapRowToReport(row: Record<string, unknown>): StoredReport {
  const citizenPhone = row.citizen_phone
    ? String(row.citizen_phone)
    : row.reporter_phone
      ? String(row.reporter_phone)
      : '+91 98220 88711'

  return {
    id: String(row.id),
    type: String(row.type || 'Mixed waste'),
    category: normalizeWasteCategory(row.category),
    location: String(row.location || 'Pune'),
    addressDetails: row.address_details ? String(row.address_details) : undefined,
    lat: Number(row.lat) || 18.5204,
    lng: Number(row.lng) || 73.8567,
    status: (row.status as StoredReport['status']) || 'Submitted',
    priority: (row.priority as StoredReport['priority']) || 'Medium',
    time: row.time ? String(row.time) : undefined,
    icon: String(row.icon || 'MW'),
    description: row.description ? String(row.description) : undefined,
    image: row.image ? String(row.image) : undefined,
    proofImage: row.proof_image ? String(row.proof_image) : undefined,
    assignedDriver: row.assigned_driver ? String(row.assigned_driver) : undefined,
    vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : undefined,
    driverPhone: row.driver_phone ? String(row.driver_phone) : '+91 98220 44123',
    reporterName: row.reporter_name ? String(row.reporter_name) : 'Citizen User',
    reporterEmail: row.reporter_email ? String(row.reporter_email) : undefined,
    citizenPhone,
    reporterPhone: citizenPhone,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
    estimatedClearance: row.estimated_clearance ? String(row.estimated_clearance) : undefined,
    greenPointsAwarded: Number(row.green_points_awarded) || 50,
  }
}

export async function fetchNeonReports(): Promise<StoredReport[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    await ensureNeonSchema()
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
    await ensureNeonSchema()
    const phone = report.citizenPhone || report.reporterPhone || '+91 98220 88711'
    await sql`
      INSERT INTO reports (
        id, type, category, location, address_details, lat, lng,
        status, priority, time, icon, description, image, proof_image,
        reporter_name, reporter_email, citizen_phone, reporter_phone,
        created_at, green_points_awarded,
        assigned_driver, vehicle_number, driver_phone, estimated_clearance
      ) VALUES (
        ${report.id}, ${report.type}, ${report.category}, ${report.location},
        ${report.addressDetails || null}, ${report.lat || 18.5204}, ${report.lng || 73.8567},
        ${report.status}, ${report.priority}, ${report.time || 'Just now'}, ${report.icon},
        ${report.description || null}, ${report.image || null}, ${report.proofImage || null},
        ${report.reporterName || 'Citizen User'}, ${report.reporterEmail || null},
        ${phone}, ${phone},
        ${report.createdAt}, ${report.greenPointsAwarded || 50},
        ${report.assignedDriver || null}, ${report.vehicleNumber || null},
        ${report.driverPhone || null}, ${report.estimatedClearance || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        assigned_driver = EXCLUDED.assigned_driver,
        vehicle_number = EXCLUDED.vehicle_number,
        driver_phone = EXCLUDED.driver_phone,
        citizen_phone = COALESCE(EXCLUDED.citizen_phone, reports.citizen_phone),
        reporter_phone = COALESCE(EXCLUDED.reporter_phone, reports.reporter_phone),
        proof_image = COALESCE(EXCLUDED.proof_image, reports.proof_image),
        estimated_clearance = COALESCE(EXCLUDED.estimated_clearance, reports.estimated_clearance),
        created_at = EXCLUDED.created_at;
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
    await ensureNeonSchema()
    await sql`
      UPDATE reports
      SET
        status = COALESCE(${partial.status ?? null}, status),
        assigned_driver = COALESCE(${partial.assignedDriver ?? null}, assigned_driver),
        vehicle_number = COALESCE(${partial.vehicleNumber ?? null}, vehicle_number),
        driver_phone = COALESCE(${partial.driverPhone ?? null}, driver_phone),
        proof_image = COALESCE(${partial.proofImage ?? null}, proof_image),
        estimated_clearance = COALESCE(${partial.estimatedClearance ?? null}, estimated_clearance)
      WHERE id = ${id};
    `
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
    await ensureNeonSchema()
    await sql`DELETE FROM reports WHERE id = ${id};`
    await sql`DELETE FROM driver_assignments WHERE report_id = ${id};`
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
    await ensureNeonSchema()
    await sql`DELETE FROM reports;`
    return true
  } catch (err) {
    console.error('Neon: error clearing reports:', err)
    return false
  }
}

export async function replaceAllNeonReports(reports: StoredReport[]): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`DELETE FROM reports;`
    for (const r of reports) {
      await insertNeonReport(r)
    }
    return true
  } catch (err) {
    console.error('Neon: error replacing reports:', err)
    return false
  }
}

// ----------------------------------------------------
// Pickups
// ----------------------------------------------------
function normalizePickupStatus(raw: unknown): PickupStatus {
  const str = String(raw || '').trim()
  if (str === 'Requested' || str === 'Accepted' || str === 'En route' || str === 'Completed' || str === 'Cancelled') {
    return str
  }
  if (str === 'Confirmed') return 'Accepted'
  return 'Accepted'
}

function mapRowToPickup(row: Record<string, unknown>): StoredPickup {
  const rawDate = String(row.date || getLocalDateString(0))
  const normalizedDate =
    rawDate === 'Today'
      ? getLocalDateString(0)
      : rawDate === 'Tomorrow'
        ? getLocalDateString(1)
        : rawDate

  return {
    id: String(row.id),
    type: String(row.type || 'Household waste'),
    address: String(row.address || 'Pune'),
    contact: row.contact ? String(row.contact) : '+91 98220 12345',
    status: normalizePickupStatus(row.status),
    date: normalizedDate,
    timeSlot: String(row.time_slot || '08:00 – 10:00 AM'),
    quantity: String(row.quantity || '10–25 kg'),
    instructions: row.instructions ? String(row.instructions) : undefined,
    driverName: row.driver_name ? String(row.driver_name) : 'Ravi Kumar',
    vehicleNumber: row.vehicle_number ? String(row.vehicle_number) : 'MH 12 AB 2840',
    driverPhone: row.driver_phone ? String(row.driver_phone) : '+91 98220 44123',
    availabilitySlotId: row.availability_slot_id ? String(row.availability_slot_id) : undefined,
    etaMinutes: row.eta_minutes ? Number(row.eta_minutes) : 14,
    lat: row.lat ? Number(row.lat) : 18.5204,
    lng: row.lng ? Number(row.lng) : 73.8567,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  }
}

export async function fetchNeonPickups(): Promise<StoredPickup[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    await ensureNeonSchema()
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
    await ensureNeonSchema()
    await sql`
      INSERT INTO pickups (
        id, type, address, contact, date, time_slot, status, quantity, instructions,
        driver_name, vehicle_number, driver_phone, availability_slot_id,
        eta_minutes, lat, lng, created_at
      ) VALUES (
        ${pickup.id}, ${pickup.type}, ${pickup.address}, ${pickup.contact || '+91 98220 12345'},
        ${pickup.date}, ${pickup.timeSlot}, ${pickup.status}, ${pickup.quantity},
        ${pickup.instructions || null}, ${pickup.driverName || null},
        ${pickup.vehicleNumber || null}, ${pickup.driverPhone || null},
        ${pickup.availabilitySlotId || null}, ${pickup.etaMinutes || 14},
        ${pickup.lat || 18.5204}, ${pickup.lng || 73.8567}, ${pickup.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        driver_name = EXCLUDED.driver_name,
        vehicle_number = EXCLUDED.vehicle_number,
        driver_phone = EXCLUDED.driver_phone,
        date = EXCLUDED.date,
        time_slot = EXCLUDED.time_slot,
        contact = EXCLUDED.contact;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting pickup:', err)
    return false
  }
}

export async function updateNeonPickup(id: string, partial: Partial<StoredPickup>): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`
      UPDATE pickups
      SET
        status = COALESCE(${partial.status ?? null}, status),
        driver_name = COALESCE(${partial.driverName ?? null}, driver_name),
        vehicle_number = COALESCE(${partial.vehicleNumber ?? null}, vehicle_number),
        driver_phone = COALESCE(${partial.driverPhone ?? null}, driver_phone)
      WHERE id = ${id};
    `
    return true
  } catch (err) {
    console.error('Neon: error updating pickup:', err)
    return false
  }
}

// ----------------------------------------------------
// Driver Availability Slots
// ----------------------------------------------------
export async function fetchNeonAvailability(): Promise<DriverAvailabilitySlot[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM driver_availability ORDER BY date ASC, created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      driverId: String(r.driver_id || 'DRV-P1'),
      driverName: String(r.driver_name || 'Ravi Kumar'),
      driverPhone: String(r.driver_phone || '+91 98220 44123'),
      vehicleNumber: String(r.vehicle_number || 'MH 12 AB 2840'),
      vehicleType: String(r.vehicle_type || 'Electric Tipper Truck (2.5T)'),
      date: String(r.date || getLocalDateString(0)),
      timeSlot: String(r.time_slot || '08:00 – 10:00 AM'),
      location: String(r.location || 'FC Road & Shivajinagar, Pune'),
      lat: Number(r.lat) || 18.5204,
      lng: Number(r.lng) || 73.8567,
      isBooked: Boolean(r.is_booked),
      bookedByPickupId: r.booked_by_pickup_id ? String(r.booked_by_pickup_id) : undefined,
      createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error('Neon: error fetching driver availability:', err)
    return []
  }
}

export async function upsertNeonAvailabilitySlot(slot: DriverAvailabilitySlot): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`
      INSERT INTO driver_availability (
        id, driver_id, driver_name, driver_phone, vehicle_number, vehicle_type,
        date, time_slot, location, lat, lng, is_booked, booked_by_pickup_id, created_at
      ) VALUES (
        ${slot.id}, ${slot.driverId}, ${slot.driverName}, ${slot.driverPhone},
        ${slot.vehicleNumber}, ${slot.vehicleType}, ${slot.date}, ${slot.timeSlot},
        ${slot.location}, ${slot.lat}, ${slot.lng}, ${slot.isBooked},
        ${slot.bookedByPickupId || null}, ${slot.createdAt || new Date().toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        driver_name = EXCLUDED.driver_name,
        driver_phone = EXCLUDED.driver_phone,
        vehicle_number = EXCLUDED.vehicle_number,
        date = EXCLUDED.date,
        time_slot = EXCLUDED.time_slot,
        location = EXCLUDED.location,
        is_booked = EXCLUDED.is_booked,
        booked_by_pickup_id = EXCLUDED.booked_by_pickup_id;
    `
    return true
  } catch (err) {
    console.error('Neon: error upserting availability slot:', err)
    return false
  }
}

export async function deleteNeonAvailabilitySlot(id: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`DELETE FROM driver_availability WHERE id = ${id};`
    return true
  } catch (err) {
    console.error('Neon: error deleting availability slot:', err)
    return false
  }
}

// ----------------------------------------------------
// Driver Assignments
// ----------------------------------------------------
export async function fetchNeonAssignments(): Promise<DriverAssignment[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM driver_assignments ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      reportId: String(r.report_id),
      type: String(r.type || 'Mixed waste'),
      location: String(r.location || 'Pune'),
      priority: (r.priority as DriverAssignment['priority']) || 'Medium',
      status: (r.status as DriverAssignment['status']) || 'New',
      timeSlot: String(r.time_slot || 'Today'),
      lat: Number(r.lat) || 18.5204,
      lng: Number(r.lng) || 73.8567,
      distanceKm: Number(r.distance_km) || 1.4,
      proofImage: r.proof_image ? String(r.proof_image) : undefined,
      driverName: r.driver_name ? String(r.driver_name) : 'Ravi Kumar',
      driverPhone: r.driver_phone ? String(r.driver_phone) : '+91 98220 44123',
      vehicleNumber: r.vehicle_number ? String(r.vehicle_number) : 'MH 12 AB 2840',
      citizenPhone: r.citizen_phone ? String(r.citizen_phone) : '+91 98220 88711',
      reportImage: r.report_image ? String(r.report_image) : undefined,
    }))
  } catch (err) {
    console.error('Neon: error fetching assignments:', err)
    return []
  }
}

export async function upsertNeonAssignment(a: DriverAssignment): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`
      INSERT INTO driver_assignments (
        id, report_id, type, location, priority, status, time_slot,
        lat, lng, distance_km, proof_image, driver_name, driver_phone,
        vehicle_number, citizen_phone, report_image, created_at
      ) VALUES (
        ${a.id}, ${a.reportId}, ${a.type}, ${a.location}, ${a.priority},
        ${a.status}, ${a.timeSlot || 'Today'}, ${a.lat}, ${a.lng},
        ${a.distanceKm || 1.4}, ${a.proofImage || null},
        ${a.driverName || 'Ravi Kumar'}, ${a.driverPhone || '+91 98220 44123'},
        ${a.vehicleNumber || 'MH 12 AB 2840'}, ${a.citizenPhone || '+91 98220 88711'},
        ${a.reportImage || null}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        driver_name = EXCLUDED.driver_name,
        driver_phone = EXCLUDED.driver_phone,
        vehicle_number = EXCLUDED.vehicle_number,
        citizen_phone = COALESCE(EXCLUDED.citizen_phone, driver_assignments.citizen_phone),
        proof_image = COALESCE(EXCLUDED.proof_image, driver_assignments.proof_image),
        time_slot = EXCLUDED.time_slot;
    `
    return true
  } catch (err) {
    console.error('Neon: error upserting assignment:', err)
    return false
  }
}

// ----------------------------------------------------
// Driver Profile
// ----------------------------------------------------
export async function fetchNeonDriverProfile(): Promise<DriverProfile | null> {
  const sql = getSql()
  if (!sql) return null
  try {
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM driver_profile LIMIT 1;`) as unknown as Record<string, unknown>[]
    if (!rows || rows.length === 0) return null
    const r = rows[0]
    return {
      id: String(r.id || 'DRV-P1'),
      name: String(r.name || 'Ravi Kumar'),
      phone: String(r.phone || '+91 98220 44123'),
      vehicleNumber: String(r.vehicle_number || 'MH 12 AB 2840'),
      vehicleType: String(r.vehicle_type || 'Electric Tipper Truck (2.5T)'),
      zone: String(r.zone || 'Central Ward & Swargate Sector'),
      depot: String(r.depot || 'East Sector Yard'),
      status: (r.status as DriverProfile['status']) || 'On Duty',
    }
  } catch (err) {
    console.error('Neon: error fetching driver profile:', err)
    return null
  }
}

export async function upsertNeonDriverProfile(p: DriverProfile): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`
      INSERT INTO driver_profile (id, name, phone, vehicle_number, vehicle_type, zone, depot, status, updated_at)
      VALUES (${p.id || 'DRV-P1'}, ${p.name}, ${p.phone}, ${p.vehicleNumber}, ${p.vehicleType}, ${p.zone}, ${p.depot}, ${p.status}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        vehicle_number = EXCLUDED.vehicle_number,
        vehicle_type = EXCLUDED.vehicle_type,
        zone = EXCLUDED.zone,
        depot = EXCLUDED.depot,
        status = EXCLUDED.status,
        updated_at = NOW();
    `
    return true
  } catch (err) {
    console.error('Neon: error upserting driver profile:', err)
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
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM users ORDER BY created_at DESC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      name: String(r.name),
      email: String(r.email),
      password: r.password ? String(r.password) : 'password123',
      role: (r.role as StoredUser['role']) || 'Citizen',
      greenPoints: r.green_points ? Number(r.green_points) : 1240,
      createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
      city: r.city ? String(r.city) : 'Pune',
      ward: r.ward ? String(r.ward) : 'Shivajinagar - Ghole Rd (PMC Ward 1)',
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
    await ensureNeonSchema()
    const userId = `USR-${Date.now()}`
    await sql`
      INSERT INTO users (id, name, email, password, role, ward, city, green_points, created_at)
      VALUES (
        ${userId}, ${user.name}, ${user.email}, ${user.password || 'password123'},
        ${user.role || 'Citizen'}, ${user.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)'},
        ${user.city || 'Pune'}, ${user.greenPoints || 1240}, ${user.createdAt || new Date().toISOString()}
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = COALESCE(EXCLUDED.password, users.password),
        role = EXCLUDED.role,
        ward = EXCLUDED.ward,
        city = EXCLUDED.city;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting user:', err)
    return false
  }
}

export async function updateNeonUserProfile(email: string, name: string, city?: string, ward?: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false
  try {
    await ensureNeonSchema()
    await sql`
      UPDATE users
      SET name = ${name},
          city = ${city || 'Pune'},
          ward = COALESCE(${ward ?? null}, ward)
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
function normalizeRewardCategory(raw: unknown): EcoReward['category'] {
  const str = String(raw || '').trim()
  if (str === 'Discount' || str === 'Eco Gear' || str === 'Tree Planting' || str === 'Rebate') {
    return str
  }
  if (str === 'Voucher') return 'Rebate'
  if (str === 'Product') return 'Eco Gear'
  return 'Discount'
}

export async function fetchNeonRewards(): Promise<EcoReward[]> {
  const sql = getSql()
  if (!sql) return []
  try {
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM rewards ORDER BY points_cost ASC;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      category: normalizeRewardCategory(r.category),
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
    await ensureNeonSchema()
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
    await ensureNeonSchema()
    const rows = (await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30;`) as unknown as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      message: String(r.message),
      time: String(r.time || 'Just now'),
      read: Boolean(r.read),
      type: (r.type as NotificationItem['type']) || 'system',
      createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
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
    await ensureNeonSchema()
    const createdAt = n.createdAt || new Date().toISOString()
    await sql`
      INSERT INTO notifications (id, title, message, time, read, type, created_at)
      VALUES (${n.id}, ${n.title}, ${n.message}, ${n.time}, ${n.read}, ${n.type}, ${createdAt})
      ON CONFLICT (id) DO UPDATE SET
        read = EXCLUDED.read;
    `
    return true
  } catch (err) {
    console.error('Neon: error inserting notification:', err)
    return false
  }
}
