import type {
  StoredReport,
  StoredPickup,
  StoredUser,
  UserSession,
  UserLocationState,
  DriverAssignment,
  DriverProfile,
  DriverAvailabilitySlot,
  EcoReward,
  NotificationItem,
  WardMetric,
} from './types'
import {
  formatRelativeTime,
  formatFullDateTime,
  formatClockTime,
  getLocalDateString,
  getDynamicClearanceEstimate,
} from './utils/dateUtils'
import { findNearestDriver } from './utils/fleetData'
import {
  isNeonConfigured,
  fetchNeonReports,
  insertNeonReport,
  updateNeonReport,
  deleteNeonReport,
  clearAllNeonReports,
  replaceAllNeonReports,
  fetchNeonPickups,
  insertNeonPickup,
  updateNeonPickup,
  fetchNeonAvailability,
  upsertNeonAvailabilitySlot,
  deleteNeonAvailabilitySlot,
  fetchNeonAssignments,
  upsertNeonAssignment,
  fetchNeonDriverProfile,
  upsertNeonDriverProfile,
  fetchNeonUsers,
  insertNeonUser,
  updateNeonUserProfile,
  fetchNeonRewards,
  updateNeonRewardClaimed,
  fetchNeonNotifications,
  insertNeonNotification,
  checkNeonConnection,
} from './db/neonClient'

export type {
  StoredReport,
  StoredPickup,
  StoredUser,
  UserSession,
  UserLocationState,
  DriverAssignment,
  DriverProfile,
  DriverAvailabilitySlot,
  EcoReward,
  NotificationItem,
  WardMetric,
}

const keys = {
  reports: 'cleanconnect.reports.v2',
  pickups: 'cleanconnect.pickups.v2',
  users: 'cleanconnect.users.v2',
  session: 'cleanconnect.session.v2',
  theme: 'cleanconnect.theme',
  points: 'cleanconnect.points.v2',
  notifications: 'cleanconnect.notifications.v2',
  assignments: 'cleanconnect.driver_assignments.v2',
  driverProfile: 'cleanconnect.driver_profile.v2',
  driverAvailability: 'cleanconnect.driver_availability.v2',
  rewards: 'cleanconnect.rewards.v2',
  location: 'cleanconnect.location.v2',
}

const LEGACY_REPORT_IDS = new Set([
  'CW-2026-008492',
  'CW-2026-008441',
  'CW-2026-008390',
  'CW-2026-008210',
])

// Reactive subscriptions
type Listener = () => void
const listeners = new Set<Listener>()

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (err) {
      console.error('Error in database listener', err)
    }
  })
}

export function subscribeToDatabase(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    if (!value) return fallback
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    notifyListeners()
  } catch (err) {
    console.error(`Failed writing to localStorage key ${key}`, err)
  }
}

// Default location: Pune, Maharashtra
export const defaultLocation: UserLocationState = {
  city: 'Pune',
  area: 'FC Road & Shivajinagar',
  lat: 18.5204,
  lng: 73.8567,
  isLiveGps: false,
}

// Dynamic Pune seed reports with realistic relative timestamps
export function generatePuneSeedReports(): StoredReport[] {
  const now = Date.now()
  const t1 = new Date(now - 18 * 60 * 1000).toISOString() // 18 mins ago
  const t2 = new Date(now - 45 * 60 * 1000).toISOString() // 45 mins ago
  const t3 = new Date(now - 2 * 3600 * 1000).toISOString() // 2 hours ago
  const t4 = new Date(now - 22 * 3600 * 1000).toISOString() // Yesterday
  const t5 = new Date(now - 46 * 3600 * 1000).toISOString() // 2 days ago

  return [
    {
      id: 'CW-2026-009102',
      type: 'Mixed waste',
      category: 'Mixed waste',
      location: 'FC Road, Near Goodluck Cafe, Pune',
      addressDetails: 'Commercial sidewalk corner near restaurant strip',
      lat: 18.5186,
      lng: 73.8415,
      status: 'Assigned',
      priority: 'High',
      time: formatRelativeTime(t1),
      icon: 'MW',
      description: 'Unsorted commercial boxes and domestic plastic accumulated near pedestrian crossing.',
      assignedDriver: 'Ravi Kumar',
      vehicleNumber: 'MH 12 AB 2840',
      driverPhone: '+91 98220 44123',
      reporterName: 'Rohan Patil',
      reporterEmail: 'rohan.patil@cleanconnect.pune',
      citizenPhone: '+91 98220 88711',
      reporterPhone: '+91 98220 88711',
      estimatedClearance: getDynamicClearanceEstimate(t1, 'Assigned', 35),
      createdAt: t1,
      greenPointsAwarded: 50,
    },
    {
      id: 'CW-2026-009088',
      type: 'Plastic & packaging',
      category: 'Plastic & packaging',
      location: 'Viman Nagar, Datta Mandir Chowk, Pune',
      addressDetails: 'Near Phoenix Marketcity service road',
      lat: 18.5679,
      lng: 73.9143,
      status: 'Team on way',
      priority: 'Medium',
      time: formatRelativeTime(t2),
      icon: 'PP',
      description: 'Single-use packaging, plastic bottles, and snack wrappers left near park pathway.',
      assignedDriver: 'Ravi Kumar',
      vehicleNumber: 'MH 12 AB 2840',
      driverPhone: '+91 98220 44123',
      reporterName: 'Avantika Kumar',
      reporterEmail: 'avantika.k@pune-clean.gov.in',
      citizenPhone: '+91 98220 33419',
      reporterPhone: '+91 98220 33419',
      estimatedClearance: getDynamicClearanceEstimate(t2, 'Team on way', 55),
      createdAt: t2,
      greenPointsAwarded: 50,
    },
    {
      id: 'CW-2026-009065',
      type: 'Overflowing Bin',
      category: 'Mixed waste',
      location: 'Koregaon Park, Lane 5, Pune',
      addressDetails: 'Opposite Osho Garden entrance',
      lat: 18.5362,
      lng: 73.894,
      status: 'Submitted',
      priority: 'High',
      time: formatRelativeTime(t3),
      icon: 'OB',
      description: 'Public bin at capacity; roadside spillage onto jogging lane. Rapid clearance requested.',
      assignedDriver: 'Amit Deshmukh',
      vehicleNumber: 'MH 12 GH 9034',
      driverPhone: '+91 98229 11984',
      reporterName: 'Pooja Kulkarni',
      reporterEmail: 'pooja.k@cleanconnect.pune',
      citizenPhone: '+91 98224 77102',
      reporterPhone: '+91 98224 77102',
      estimatedClearance: getDynamicClearanceEstimate(t3, 'Submitted', 145),
      createdAt: t3,
      greenPointsAwarded: 50,
    },
    {
      id: 'CW-2026-009071',
      type: 'Construction debris',
      category: 'Construction debris',
      location: 'Kothrud, Near Karve Statue, Pune',
      addressDetails: 'Near Mayur Colony main road',
      lat: 18.5074,
      lng: 73.8077,
      status: 'Resolved',
      priority: 'Critical',
      time: formatRelativeTime(t4),
      icon: 'CD',
      description: 'Broken concrete slabs and demolition plaster obstructing residential entry. Cleared by PMC Heavy Squad.',
      assignedDriver: 'Nitin Pawar',
      vehicleNumber: 'MH 12 EF 7721',
      driverPhone: '+91 98224 88712',
      reporterName: 'Suresh Shinde',
      reporterEmail: 'suresh.s@cleanconnect.pune',
      citizenPhone: '+91 98221 90112',
      reporterPhone: '+91 98221 90112',
      estimatedClearance: 'Cleared & Verified',
      createdAt: t4,
      greenPointsAwarded: 100,
    },
    {
      id: 'CW-2026-009054',
      type: 'Organic waste',
      category: 'Organic waste',
      location: 'Shivajinagar, Modern College Chowk, Pune',
      addressDetails: 'Fresh produce transit point',
      lat: 18.5308,
      lng: 73.8474,
      status: 'Resolved',
      priority: 'Medium',
      time: formatRelativeTime(t5),
      icon: 'OW',
      description: 'Vegetable leaves and organic wet waste diverted directly to PMC bio-methanation plant.',
      assignedDriver: 'Suresh Patil',
      vehicleNumber: 'MH 12 CD 3912',
      driverPhone: '+91 98221 55678',
      reporterName: 'Rohan Patil',
      reporterEmail: 'rohan.patil@cleanconnect.pune',
      citizenPhone: '+91 98220 88711',
      reporterPhone: '+91 98220 88711',
      estimatedClearance: 'Cleared & Verified',
      createdAt: t5,
      greenPointsAwarded: 50,
    },
  ]
}

export function generatePuneSeedPickups(): StoredPickup[] {
  const today = getLocalDateString(0)
  return [
    {
      id: 'PK-2026-004120',
      type: 'Society / apartment waste',
      address: 'Bluebell Heights, Near Symbiosis, Viman Nagar, Pune',
      contact: '+91 98220 12345',
      status: 'En route',
      date: today,
      timeSlot: '10:00 AM – 12:00 PM',
      quantity: '25–50 kg',
      instructions: 'Gate 2 security will guide driver to basement segregated collection room.',
      vehicleNumber: 'MH 12 AB 2840',
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      etaMinutes: 14,
      lat: 18.5679,
      lng: 73.9143,
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ]
}

export const defaultDriverProfile: DriverProfile = {
  id: 'DRV-P1',
  name: 'Ravi Kumar',
  phone: '+91 98220 44123',
  vehicleNumber: 'MH 12 AB 2840',
  vehicleType: 'Electric Tipper Truck (2.5T)',
  zone: 'Central Ward & Swargate Sector',
  depot: 'East Sector Yard',
  status: 'On Duty',
}

export function generateSeedDriverAvailability(): DriverAvailabilitySlot[] {
  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)
  const dayAfter = getLocalDateString(2)

  return [
    {
      id: 'SLOT-DRV-01',
      driverId: 'DRV-P1',
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      vehicleType: 'Electric Tipper Truck (2.5T)',
      date: today,
      timeSlot: '10:00 AM – 12:00 PM',
      location: 'FC Road & Shivajinagar, Pune',
      lat: 18.5204,
      lng: 73.8567,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SLOT-DRV-02',
      driverId: 'DRV-P1',
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      vehicleType: 'Electric Tipper Truck (2.5T)',
      date: today,
      timeSlot: '02:00 – 04:00 PM',
      location: 'FC Road & Shivajinagar, Pune',
      lat: 18.5204,
      lng: 73.8567,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SLOT-DRV-03',
      driverId: 'DRV-P2',
      driverName: 'Suresh Patil',
      driverPhone: '+91 98221 55678',
      vehicleNumber: 'MH 12 CD 3912',
      vehicleType: 'Electric Tipper Truck (2.5T)',
      date: today,
      timeSlot: '04:00 – 06:00 PM',
      location: 'Kothrud & Karve Nagar, Pune',
      lat: 18.5074,
      lng: 73.8077,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SLOT-DRV-04',
      driverId: 'DRV-P1',
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      vehicleType: 'Electric Tipper Truck (2.5T)',
      date: tomorrow,
      timeSlot: '08:00 – 10:00 AM',
      location: 'FC Road & Shivajinagar, Pune',
      lat: 18.5204,
      lng: 73.8567,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SLOT-DRV-05',
      driverId: 'DRV-P3',
      driverName: 'Nitin Pawar',
      driverPhone: '+91 98224 88712',
      vehicleNumber: 'MH 12 EF 7721',
      vehicleType: 'Heavy Compactor Truck (6T)',
      date: tomorrow,
      timeSlot: '10:00 AM – 12:00 PM',
      location: 'Kothrud & Karve Nagar, Pune',
      lat: 18.5074,
      lng: 73.8077,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'SLOT-DRV-06',
      driverId: 'DRV-P4',
      driverName: 'Amit Deshmukh',
      driverPhone: '+91 98229 11984',
      vehicleNumber: 'MH 12 GH 9034',
      vehicleType: 'Electric Tipper Truck (2.5T)',
      date: dayAfter,
      timeSlot: '08:00 – 10:00 AM',
      location: 'Viman Nagar, Pune',
      lat: 18.5679,
      lng: 73.9143,
      isBooked: false,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function generateDefaultDriverAssignments(): DriverAssignment[] {
  const now = Date.now()
  return [
    {
      id: 'ASG-201',
      reportId: 'CW-2026-009102',
      type: 'Mixed waste (Commercial)',
      location: 'FC Road, Near Goodluck Cafe, Pune',
      priority: 'High',
      status: 'New',
      timeSlot: `Today (${formatClockTime(now)} – ${formatClockTime(now + 30 * 60000)})`,
      lat: 18.5186,
      lng: 73.8415,
      distanceKm: 1.4,
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      citizenPhone: '+91 98220 88711',
    },
    {
      id: 'ASG-202',
      reportId: 'PK-2026-004120',
      type: 'Society pickup (25–50 kg segregated)',
      location: 'Bluebell Heights, Viman Nagar, Pune',
      priority: 'Medium',
      status: 'Accepted',
      timeSlot: `${getLocalDateString(0)} (10:00 AM – 12:00 PM)`,
      lat: 18.5679,
      lng: 73.9143,
      distanceKm: 4.8,
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      citizenPhone: '+91 98220 12345',
    },
    {
      id: 'ASG-203',
      reportId: 'CW-2026-009088',
      type: 'Plastic & packaging',
      location: 'Viman Nagar, Datta Mandir Chowk, Pune',
      priority: 'Medium',
      status: 'New',
      timeSlot: `Today (${formatClockTime(now + 30 * 60000)} – ${formatClockTime(now + 60 * 60000)})`,
      lat: 18.5679,
      lng: 73.9143,
      distanceKm: 5.2,
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98220 44123',
      vehicleNumber: 'MH 12 AB 2840',
      citizenPhone: '+91 98220 33419',
    },
  ]
}

export const defaultDriverAssignments: DriverAssignment[] = generateDefaultDriverAssignments()

export const defaultRewards: EcoReward[] = [
  {
    id: 'REW-01',
    title: 'Pune Metro Card Recharge Pass',
    category: 'Discount',
    pointsCost: 300,
    icon: 'Train',
    description: 'Direct recharge voucher for Maha Metro Pune smart card or QR ticket.',
    code: 'PUNE-METRO-2026',
  },
  {
    id: 'REW-02',
    title: 'Home Composting Starter Kit',
    category: 'Eco Gear',
    pointsCost: 600,
    icon: 'Package',
    description: 'Aerobic composting drum with 2 kg bio-culture mix delivered to your doorstep.',
    code: 'COMPOST-HERO-KIT',
  },
  {
    id: 'REW-03',
    title: 'PMC Civic Property Tax Rebate Token',
    category: 'Rebate',
    pointsCost: 1000,
    icon: 'Award',
    description: 'City municipal rebate certificate valid for property tax assessment.',
    code: 'PMC-CIVIC-HERO-26',
  },
  {
    id: 'REW-04',
    title: 'Native Sapling Planted in Your Name',
    category: 'Tree Planting',
    pointsCost: 400,
    icon: 'TreePine',
    description: 'Urban forestry partner plants a geo-tagged Neem or Peepal tree in Pune green belt.',
    code: 'TREE-PUNE-7749',
  },
]

export function generateDefaultNotifications(): NotificationItem[] {
  const now = Date.now()
  const t1 = new Date(now - 12 * 60 * 1000).toISOString()
  const t2 = new Date(now - 2 * 60 * 1000).toISOString()
  return [
    {
      id: 'NOTIF-01',
      title: 'Collection vehicle dispatched',
      message: 'Driver Ravi Kumar (MH 12 AB 2840) is en route. Estimated arrival in 14 mins.',
      time: formatRelativeTime(t1),
      read: false,
      type: 'pickup',
      createdAt: t1,
    },
    {
      id: 'NOTIF-02',
      title: 'CleanConnect Grid Online',
      message: 'Welcome to CleanConnect. Live GPS coordinates, driver shifts, and reports are active.',
      time: formatRelativeTime(t2),
      read: false,
      type: 'system',
      createdAt: t2,
    },
  ]
}

export const defaultNotifications: NotificationItem[] = generateDefaultNotifications()

export const puneWards: WardMetric[] = [
  { id: 'W-P1', name: 'Shivajinagar - Ghole Rd (PMC Ward 1)', cleanlinessScore: 92, openReports: 2, resolvedToday: 19, activeFleet: 5, status: 'Optimal' },
  { id: 'W-P2', name: 'Kothrud - Bavdhan (PMC Ward 2)', cleanlinessScore: 95, openReports: 1, resolvedToday: 24, activeFleet: 6, status: 'Optimal' },
  { id: 'W-P3', name: 'Viman Nagar - Nagar Rd (PMC Ward 3)', cleanlinessScore: 86, openReports: 4, resolvedToday: 15, activeFleet: 4, status: 'Attention' },
  { id: 'W-P4', name: 'Koregaon Park - Dhole Patil (PMC Ward 4)', cleanlinessScore: 89, openReports: 3, resolvedToday: 18, activeFleet: 4, status: 'Optimal' },
  { id: 'W-P5', name: 'Hinjewadi - PCMC Tech Corridor', cleanlinessScore: 78, openReports: 7, resolvedToday: 12, activeFleet: 4, status: 'Critical' },
]

export const defaultUsers: StoredUser[] = [
  {
    name: 'Rohan Patil',
    email: 'rohan.patil@cleanconnect.pune',
    password: 'password123',
    role: 'Citizen',
    ward: 'Shivajinagar - Ghole Rd (PMC Ward 1)',
    city: 'Pune',
    greenPoints: 1240,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    name: 'Avantika Kumar',
    email: 'avantika.k@pune-clean.gov.in',
    password: 'password123',
    role: 'Citizen',
    ward: 'Kothrud - Bavdhan (PMC Ward 2)',
    city: 'Pune',
    greenPoints: 2150,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    name: 'Driver Ravi Kumar',
    email: 'driver.ravi@cleanconnect.pune',
    password: 'password123',
    role: 'Driver',
    ward: 'Central Ward & Swargate Sector',
    city: 'Pune',
    greenPoints: 800,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    name: 'Supervisor Deshmukh',
    email: 'admin.deshmukh@cleanconnect.pune',
    password: 'password123',
    role: 'Admin',
    ward: 'PMC Central Command',
    city: 'Pune',
    greenPoints: 1500,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
]

const SEED_REPORT_OFFSETS_MS: Record<string, number> = {
  'CW-2026-009102': 18 * 60 * 1000,
  'CW-2026-009088': 45 * 60 * 1000,
  'CW-2026-009065': 2 * 3600 * 1000,
  'CW-2026-009071': 22 * 3600 * 1000,
  'CW-2026-009054': 46 * 3600 * 1000,
}

/**
 * Self-healing normalization for reports:
 * - Removes legacy v1 seed reports with broken categories
 * - Refreshes seed report timestamps if they are stale from an earlier day
 * - Ensures every report has accurate relative time, phone numbers, and clearance estimate
 */
function sanitizeAndRefreshReports(list: StoredReport[]): { reports: StoredReport[]; modified: boolean } {
  let modified = false
  const filtered = list.filter((r) => {
    if (LEGACY_REPORT_IDS.has(r.id)) {
      modified = true
      return false
    }
    return true
  })

  if (filtered.length === 0) {
    return { reports: [], modified }
  }

  // Check if primary seed report is stale (> 6 hours old instead of 18 mins)
  const primarySeed = filtered.find((r) => r.id === 'CW-2026-009102')
  const now = Date.now()
  const seedIsStale =
    primarySeed &&
    (isNaN(new Date(primarySeed.createdAt).getTime()) ||
      now - new Date(primarySeed.createdAt).getTime() > 6 * 3600 * 1000)

  const normalized = filtered.map((r) => {
    let createdAt = r.createdAt
    if (seedIsStale && SEED_REPORT_OFFSETS_MS[r.id]) {
      createdAt = new Date(now - SEED_REPORT_OFFSETS_MS[r.id]).toISOString()
      modified = true
    } else if (!createdAt || isNaN(new Date(createdAt).getTime())) {
      createdAt = new Date(now - 10 * 60 * 1000).toISOString()
      modified = true
    }

    const citizenPhone = r.citizenPhone || r.reporterPhone || '+91 98220 88711'
    const driverPhone = r.driverPhone || '+91 98220 44123'
    const assignedDriver = r.assignedDriver || 'Ravi Kumar'
    const vehicleNumber = r.vehicleNumber || 'MH 12 AB 2840'
    const estimatedClearance =
      r.status === 'Resolved'
        ? 'Cleared & Verified'
        : !r.estimatedClearance ||
            r.estimatedClearance.includes('2:30') ||
            r.estimatedClearance.includes('1:45')
          ? getDynamicClearanceEstimate(createdAt, r.status, 35)
          : r.estimatedClearance

    return {
      ...r,
      createdAt,
      time: formatRelativeTime(createdAt),
      citizenPhone,
      reporterPhone: citizenPhone,
      driverPhone,
      assignedDriver,
      vehicleNumber,
      estimatedClearance,
    }
  })

  return { reports: normalized, modified }
}

/**
 * Self-healing normalization for pickups:
 * - Removes legacy v1 pickup PK-2026-004098 with hardcoded Oct 06 date
 * - Normalizes legacy 'Confirmed' status to 'Accepted'
 * - Rolls past dates on seed pickup PK-2026-004120 to Today
 */
function sanitizeAndRefreshPickups(list: StoredPickup[]): { pickups: StoredPickup[]; modified: boolean } {
  let modified = false
  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)

  const filtered = list.filter((p) => {
    if (p.id === 'PK-2026-004098') {
      modified = true
      return false
    }
    return true
  })

  const normalized = filtered.map((p) => {
    let status = p.status
    if ((status as string) === 'Confirmed') {
      status = 'Accepted'
      modified = true
    }
    let date = p.date
    if (date === 'Today' || (p.id === 'PK-2026-004120' && date < today)) {
      date = today
      modified = true
    } else if (date === 'Tomorrow') {
      date = tomorrow
      modified = true
    }

    const driverName = p.driverName || 'Ravi Kumar'
    const driverPhone = p.driverPhone || '+91 98220 44123'
    const vehicleNumber = p.vehicleNumber || 'MH 12 AB 2840'
    const contact = p.contact || '+91 98220 12345'
    const createdAt =
      !p.createdAt || isNaN(new Date(p.createdAt).getTime())
        ? new Date(Date.now() - 35 * 60 * 1000).toISOString()
        : p.createdAt

    return {
      ...p,
      status,
      date,
      driverName,
      driverPhone,
      vehicleNumber,
      contact,
      createdAt,
    }
  })

  return { pickups: normalized, modified }
}

/**
 * Self-healing normalization for driver availability slots:
 * - Rolls any unbooked seed slots with past dates forward to Today / Tomorrow / DayAfter
 */
function sanitizeAndRefreshSlots(list: DriverAvailabilitySlot[]): {
  slots: DriverAvailabilitySlot[]
  modified: boolean
} {
  let modified = false
  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)
  const dayAfter = getLocalDateString(2)

  const normalized = list.map((s, idx) => {
    if (!s.isBooked && s.date < today) {
      modified = true
      const nextDate = idx % 3 === 0 ? today : idx % 3 === 1 ? tomorrow : dayAfter
      return { ...s, date: nextDate }
    }
    return s
  })

  return { slots: normalized, modified }
}

/**
 * Two-way background synchronization with Neon PostgreSQL:
 * 1. Pushes all local users, reports, pickups, slots, assignments, and driver profile to Neon
 *    so newly added reports and registered users in the app are guaranteed to appear in Neon!
 * 2. Pulls remote records and merges them cleanly without wiping local passwords or fresh edits.
 */
export async function syncFromNeon(): Promise<boolean> {
  if (!isNeonConfigured) return false
  try {
    // Step 1: Push local state to Neon first so any locally created reports/users/pickups are persisted in Neon
    const localUsers = database.getUsers()
    const localReports = database.getReports()
    const localPickups = database.getPickups()
    const localSlots = database.getDriverAvailability()
    const localAssignments = database.getDriverAssignments()
    const localDriverProfile = database.getDriverProfile()

    await Promise.allSettled([
      ...localUsers.map((u) => insertNeonUser(u)),
      ...localReports.map((r) => insertNeonReport(r)),
      ...localPickups.map((p) => insertNeonPickup(p)),
      ...localSlots.map((s) => upsertNeonAvailabilitySlot(s)),
      ...localAssignments.map((a) => upsertNeonAssignment(a)),
      upsertNeonDriverProfile(localDriverProfile),
    ])

    // Step 2: Fetch merged state from Neon
    const [
      remoteReports,
      remotePickups,
      remoteRewards,
      remoteNotifications,
      remoteUsers,
      remoteSlots,
      remoteAssignments,
      remoteProfile,
    ] = await Promise.all([
      fetchNeonReports(),
      fetchNeonPickups(),
      fetchNeonRewards(),
      fetchNeonNotifications(),
      fetchNeonUsers(),
      fetchNeonAvailability(),
      fetchNeonAssignments(),
      fetchNeonDriverProfile(),
    ])

    let changed = false

    if (remoteReports && remoteReports.length > 0) {
      // Merge local images if any remote row didn't have them
      const localMap = new Map(localReports.map((r) => [r.id, r]))
      const mergedReports = remoteReports.map((rem) => {
        const loc = localMap.get(rem.id)
        return {
          ...rem,
          image: rem.image || loc?.image,
          proofImage: rem.proofImage || loc?.proofImage,
          citizenPhone: rem.citizenPhone || loc?.citizenPhone || '+91 98220 88711',
          driverPhone: rem.driverPhone || loc?.driverPhone || '+91 98220 44123',
        }
      })
      const { reports: cleanReports } = sanitizeAndRefreshReports(mergedReports)
      write(keys.reports, cleanReports)
      changed = true
    }

    if (remotePickups && remotePickups.length > 0) {
      const { pickups: cleanPickups } = sanitizeAndRefreshPickups(remotePickups)
      write(keys.pickups, cleanPickups)
      changed = true
    }

    if (remoteSlots && remoteSlots.length > 0) {
      const { slots: cleanSlots } = sanitizeAndRefreshSlots(remoteSlots)
      write(keys.driverAvailability, cleanSlots)
      changed = true
    }

    if (remoteAssignments && remoteAssignments.length > 0) {
      write(keys.assignments, remoteAssignments)
      changed = true
    }

    if (remoteProfile) {
      write(keys.driverProfile, remoteProfile)
      changed = true
    }

    if (remoteRewards && remoteRewards.length > 0) {
      write(keys.rewards, remoteRewards)
      changed = true
    }

    if (remoteNotifications && remoteNotifications.length > 0) {
      write(keys.notifications, remoteNotifications)
      changed = true
    }

    if (remoteUsers && remoteUsers.length > 0) {
      const localUserMap = new Map(localUsers.map((u) => [u.email.toLowerCase(), u]))
      const mergedUsers: StoredUser[] = remoteUsers.map((ru) => {
        const existingLocal = localUserMap.get(ru.email.toLowerCase())
        return {
          ...ru,
          password: ru.password || existingLocal?.password || 'password123',
          greenPoints: ru.greenPoints ?? existingLocal?.greenPoints ?? 1240,
          ward: ru.ward || existingLocal?.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)',
          city: ru.city || existingLocal?.city || 'Pune',
        }
      })
      // Also keep any local users not yet in remoteUsers
      for (const lu of localUsers) {
        if (!mergedUsers.some((mu) => mu.email.toLowerCase() === lu.email.toLowerCase())) {
          mergedUsers.push(lu)
        }
      }
      write(keys.users, mergedUsers)
      changed = true
    }

    if (changed) {
      notifyListeners()
    }
    return true
  } catch (err) {
    console.warn('Neon sync warning:', err)
    return false
  }
}

// Trigger initial Neon sync if configured
if (isNeonConfigured) {
  syncFromNeon().catch((err) => console.warn('Initial Neon sync failed:', err))
}

export const database = {
  // Session & Authentication
  getSession(): UserSession | null {
    return read<UserSession | null>(keys.session, null)
  },

  setSession(session: UserSession | null) {
    if (session) {
      write(keys.session, session)
    } else {
      window.localStorage.removeItem(keys.session)
      notifyListeners()
    }
  },

  getUsers(): StoredUser[] {
    const stored = read<StoredUser[]>(keys.users, [])
    if (stored.length > 0) {
      // Ensure passwords are never empty strings from legacy syncs
      const repaired = stored.map((u) => ({
        ...u,
        password: u.password || 'password123',
      }))
      return repaired
    }
    write(keys.users, defaultUsers)
    return defaultUsers
  },

  register(user: StoredUser): UserSession {
    const newUser: StoredUser = {
      ...user,
      password: user.password || 'password123',
      role: user.role || 'Citizen',
      city: user.city || database.getLocation().city || 'Pune',
      ward: user.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)',
      greenPoints: user.greenPoints ?? 1240,
      createdAt: user.createdAt || new Date().toISOString(),
    }
    const existing = database.getUsers()
    const next = [...existing.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser]
    write(keys.users, next)

    const session: UserSession = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'Citizen',
      city: newUser.city,
      ward: newUser.ward,
    }
    write(keys.session, session)

    if (isNeonConfigured) {
      insertNeonUser(newUser).catch((err) => console.warn('Neon user insert error:', err))
    }

    return session
  },

  signIn(email: string, password: string): UserSession | null {
    const user = database
      .getUsers()
      .find(
        (candidate) =>
          candidate.email.toLowerCase() === email.toLowerCase() &&
          (candidate.password === password || (!candidate.password && password === 'password123'))
      )
    if (!user) return null

    const session: UserSession = {
      name: user.name,
      email: user.email,
      role: user.role || 'Citizen',
      city: user.city || database.getLocation().city,
      ward: user.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)',
    }
    write(keys.session, session)

    if (isNeonConfigured) {
      insertNeonUser(user).catch((err) => console.warn('Neon user sync on sign-in error:', err))
    }

    return session
  },

  signOut() {
    window.localStorage.removeItem(keys.session)
    notifyListeners()
  },

  updateProfile(name: string, email: string, city?: string, ward?: string): UserSession {
    const current = database.getSession()
    const updated: UserSession = {
      name: name.trim(),
      email: email.trim(),
      role: current?.role || 'Citizen',
      city: city || current?.city || 'Pune',
      ward: ward || current?.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)',
    }
    write(keys.session, updated)

    // Sync in users list
    const users = database.getUsers().map((u) =>
      u.email.toLowerCase() === (current?.email || '').toLowerCase()
        ? { ...u, name: updated.name, email: updated.email, ward: updated.ward, city: updated.city }
        : u
    )
    write(keys.users, users)

    if (isNeonConfigured) {
      updateNeonUserProfile(email, name, city, ward).catch((err) =>
        console.warn('Neon user profile update error:', err)
      )
    }

    return updated
  },

  // Location & City
  getLocation(): UserLocationState {
    return read<UserLocationState>(keys.location, defaultLocation)
  },

  setLocation(loc: UserLocationState) {
    write(keys.location, loc)
  },

  // Reports
  getReports(): StoredReport[] {
    const stored = read<StoredReport[]>(keys.reports, [])
    if (stored.length > 0) {
      const { reports: sanitized, modified } = sanitizeAndRefreshReports(stored)
      if (sanitized.length > 0) {
        if (modified) {
          try {
            window.localStorage.setItem(keys.reports, JSON.stringify(sanitized))
          } catch {
            // ignore
          }
        }
        return sanitized
      }
    }
    const seed = generatePuneSeedReports()
    write(keys.reports, seed)
    return seed
  },

  addReport(report: StoredReport): StoredReport {
    // 1. Smart Municipal Auto-Dispatch
    const activeDriver = database.getDriverProfile()
    const driver = findNearestDriver(report.lat, report.lng, activeDriver)
    const createdAt = report.createdAt || new Date().toISOString()
    const citizenPhone = report.citizenPhone || report.reporterPhone || '+91 98220 88711'

    const enrichedReport: StoredReport = {
      ...report,
      createdAt,
      time: formatRelativeTime(createdAt),
      status: report.status === 'Submitted' ? 'Assigned' : report.status,
      assignedDriver: report.assignedDriver || driver.name,
      vehicleNumber: report.vehicleNumber || driver.vehicleNumber,
      driverPhone: report.driverPhone || driver.phone,
      citizenPhone,
      reporterPhone: citizenPhone,
      estimatedClearance:
        report.estimatedClearance || getDynamicClearanceEstimate(createdAt, 'Assigned', 35),
    }

    const currentReports = database.getReports()
    const next = [enrichedReport, ...currentReports.filter((r) => r.id !== enrichedReport.id)]
    write(keys.reports, next)
    database.addGreenPoints(50)

    // 2. Automatically dispatch route stop to driver's queue with accurate clock window
    const distanceKm =
      Math.round(
        Math.hypot(
          driver.lat - (enrichedReport.lat || 18.5204),
          driver.lng - (enrichedReport.lng || 73.8567)
        ) *
          111 *
          10
      ) / 10 || 1.4

    const nowMs = new Date(createdAt).getTime()
    const newAssignment: DriverAssignment = {
      id: `ASG-${Date.now().toString().slice(-4)}`,
      reportId: enrichedReport.id,
      type: enrichedReport.type,
      location: enrichedReport.location,
      priority: enrichedReport.priority,
      status: 'New',
      timeSlot: `Today (${formatClockTime(nowMs)} – ${formatClockTime(nowMs + 35 * 60000)})`,
      lat: enrichedReport.lat || 18.5204,
      lng: enrichedReport.lng || 73.8567,
      distanceKm,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      citizenPhone,
      reportImage: enrichedReport.image,
    }
    const currentAssignments = database.getDriverAssignments()
    write(keys.assignments, [newAssignment, ...currentAssignments])

    if (isNeonConfigured) {
      insertNeonReport(enrichedReport).catch((err) => console.warn('Neon report insert error:', err))
      upsertNeonAssignment(newAssignment).catch((err) => console.warn('Neon assignment insert error:', err))
    }

    // 3. Notify citizen with assigned driver contact & vehicle
    const notifTime = new Date().toISOString()
    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: '🚛 Municipal Driver Dispatched!',
      message: `${driver.name} (${driver.vehicleNumber}) has been assigned to ${enrichedReport.id}. Contact: ${driver.phone}. ${enrichedReport.estimatedClearance}.`,
      time: formatRelativeTime(notifTime),
      createdAt: notifTime,
      read: false,
      type: 'report',
    })

    return enrichedReport
  },

  updateReport(id: string, updates: Partial<StoredReport>): StoredReport[] {
    const reports = database.getReports().map((r) => {
      if (r.id === id) {
        const updatedStatus = updates.status || r.status
        const estimatedClearance =
          updatedStatus === 'Resolved'
            ? 'Cleared & Verified'
            : updates.estimatedClearance || r.estimatedClearance
        return {
          ...r,
          ...updates,
          estimatedClearance,
          time: formatRelativeTime(r.createdAt),
        }
      }
      return r
    })
    write(keys.reports, reports)

    // Synchronize status/driver changes with DriverAssignments
    const assignments = database.getDriverAssignments().map((a) => {
      if (a.reportId === id) {
        let nextStatus = a.status
        if (updates.status === 'Resolved') nextStatus = 'Collected'
        else if (updates.status === 'In progress') nextStatus = 'Arrived'
        else if (updates.status === 'Team on way') nextStatus = 'Accepted'
        else if (updates.status === 'Assigned' || updates.status === 'Submitted') nextStatus = 'New'

        const updatedAssignment: DriverAssignment = {
          ...a,
          status: nextStatus,
          driverName: updates.assignedDriver || a.driverName,
          vehicleNumber: updates.vehicleNumber || a.vehicleNumber,
          driverPhone: updates.driverPhone || a.driverPhone,
          proofImage: updates.proofImage || a.proofImage,
        }
        if (isNeonConfigured) {
          upsertNeonAssignment(updatedAssignment).catch(() => {})
        }
        return updatedAssignment
      }
      return a
    })
    write(keys.assignments, assignments)

    if (isNeonConfigured) {
      updateNeonReport(id, updates).catch((err) => console.warn('Neon report update error:', err))
    }

    return reports
  },

  deleteReport(id: string): StoredReport[] {
    const reports = database.getReports().filter((r) => r.id !== id)
    write(keys.reports, reports)

    const assignments = database.getDriverAssignments().filter((a) => a.reportId !== id)
    write(keys.assignments, assignments)

    if (isNeonConfigured) {
      deleteNeonReport(id).catch((err) => console.warn('Neon report delete error:', err))
    }

    return reports
  },

  clearAllReports(): StoredReport[] {
    write(keys.reports, [])
    const remainingAssignments = database
      .getDriverAssignments()
      .filter((a) => a.reportId.startsWith('PK-'))
    write(keys.assignments, remainingAssignments)

    if (isNeonConfigured) {
      clearAllNeonReports().catch((err) => console.warn('Neon reports clear error:', err))
    }

    return []
  },

  resetDemoReports(_city = 'Pune'): StoredReport[] {
    const seedReports = generatePuneSeedReports()
    const seedPickups = generatePuneSeedPickups()
    const seedSlots = generateSeedDriverAvailability()
    const seedAssignments = generateDefaultDriverAssignments()

    write(keys.reports, seedReports)
    write(keys.pickups, seedPickups)
    write(keys.driverAvailability, seedSlots)
    write(keys.assignments, seedAssignments)

    if (isNeonConfigured) {
      replaceAllNeonReports(seedReports).catch((err) =>
        console.warn('Neon reset reports error:', err)
      )
      seedPickups.forEach((p) => insertNeonPickup(p).catch(() => {}))
      seedSlots.forEach((s) => upsertNeonAvailabilitySlot(s).catch(() => {}))
      seedAssignments.forEach((a) => upsertNeonAssignment(a).catch(() => {}))
    }

    return seedReports
  },

  // Pickups
  getPickups(): StoredPickup[] {
    const stored = read<StoredPickup[]>(keys.pickups, [])
    if (stored.length > 0) {
      const { pickups: sanitized, modified } = sanitizeAndRefreshPickups(stored)
      if (sanitized.length > 0) {
        if (modified) {
          try {
            window.localStorage.setItem(keys.pickups, JSON.stringify(sanitized))
          } catch {
            // ignore
          }
        }
        return sanitized
      }
    }
    const seed = generatePuneSeedPickups()
    write(keys.pickups, seed)
    return seed
  },

  addPickup(pickup: StoredPickup): StoredPickup {
    // 1. Resolve coordinates & address
    const userLoc = database.getLocation()
    const lat = pickup.lat || userLoc.lat || 18.5204
    const lng = pickup.lng || userLoc.lng || 73.8567
    const createdAt = pickup.createdAt || new Date().toISOString()

    // 2. Check for matching declared Driver Availability Slot
    let assignedDriverName =
      pickup.driverName && pickup.driverName !== 'Pending assignment' ? pickup.driverName : ''
    let assignedDriverPhone = pickup.driverPhone || ''
    let assignedVehicleNumber = pickup.vehicleNumber || ''
    let matchedSlotId = pickup.availabilitySlotId

    if (matchedSlotId) {
      const slot = database.getDriverAvailability().find((s) => s.id === matchedSlotId)
      if (slot) {
        assignedDriverName = slot.driverName
        assignedDriverPhone = slot.driverPhone
        assignedVehicleNumber = slot.vehicleNumber
      }
    } else {
      const availableSlots = database.getAvailableDriversForSlot(
        pickup.date,
        pickup.timeSlot,
        lat,
        lng,
        pickup.address
      )
      if (availableSlots.length > 0) {
        const bestSlot = availableSlots[0]
        matchedSlotId = bestSlot.id
        assignedDriverName = bestSlot.driverName
        assignedDriverPhone = bestSlot.driverPhone
        assignedVehicleNumber = bestSlot.vehicleNumber
      }
    }

    // Fallback to active driver profile or nearest fleet driver if no slot matched
    if (!assignedDriverName) {
      const activeDriver = database.getDriverProfile()
      const driver = findNearestDriver(lat, lng, activeDriver)
      assignedDriverName = driver.name
      assignedDriverPhone = driver.phone
      assignedVehicleNumber = driver.vehicleNumber
    }

    const distanceKm =
      Math.round(
        Math.hypot(lat - (userLoc.lat || 18.5204), lng - (userLoc.lng || 73.8567)) * 111 * 10
      ) / 10 || 2.4

    const etaMinutes = pickup.etaMinutes || Math.max(12, Math.round(distanceKm * 4 + 8))

    const enrichedPickup: StoredPickup = {
      ...pickup,
      lat,
      lng,
      createdAt,
      status: 'Accepted',
      driverName: assignedDriverName,
      driverPhone: assignedDriverPhone,
      vehicleNumber: assignedVehicleNumber,
      availabilitySlotId: matchedSlotId,
      etaMinutes,
    }

    const current = database.getPickups()
    const next = [enrichedPickup, ...current.filter((p) => p.id !== enrichedPickup.id)]
    write(keys.pickups, next)

    // Mark availability slot as booked
    if (matchedSlotId) {
      database.bookDriverSlot(matchedSlotId, enrichedPickup.id)
    }

    // 3. Automatically insert scheduled pickup into Driver's Live Assignment Queue
    const newAssignment: DriverAssignment = {
      id: `ASG-${enrichedPickup.id}`,
      reportId: enrichedPickup.id,
      type: `Doorstep Pickup (${enrichedPickup.type} - ${enrichedPickup.quantity})`,
      location: enrichedPickup.address,
      priority: 'Medium',
      status: 'New',
      timeSlot: `${enrichedPickup.date} (${enrichedPickup.timeSlot})`,
      lat,
      lng,
      distanceKm,
      driverName: enrichedPickup.driverName,
      driverPhone: enrichedPickup.driverPhone,
      vehicleNumber: enrichedPickup.vehicleNumber,
      citizenPhone: enrichedPickup.contact,
    }
    const currentAssignments = database.getDriverAssignments()
    write(keys.assignments, [newAssignment, ...currentAssignments])

    if (isNeonConfigured) {
      insertNeonPickup(enrichedPickup).catch((err) => console.warn('Neon pickup insert error:', err))
      upsertNeonAssignment(newAssignment).catch((err) =>
        console.warn('Neon pickup assignment insert error:', err)
      )
    }

    // 4. Send citizen notification with Driver name, vehicle number, and variable phone
    const notifTime = new Date().toISOString()
    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: '🚛 Collection Vehicle Booked & Assigned!',
      message: `Driver ${enrichedPickup.driverName} (${enrichedPickup.vehicleNumber}) has been assigned for ${enrichedPickup.date} (${enrichedPickup.timeSlot}). Direct Phone: ${enrichedPickup.driverPhone}.`,
      time: formatRelativeTime(notifTime),
      createdAt: notifTime,
      read: false,
      type: 'pickup',
    })

    return enrichedPickup
  },

  updatePickupStatus(id: string, status: StoredPickup['status']): StoredPickup[] {
    const pickups = database.getPickups().map((p) => (p.id === id ? { ...p, status } : p))
    write(keys.pickups, pickups)

    // Sync with DriverAssignments
    const assignments = database.getDriverAssignments()
    if (status === 'Cancelled') {
      write(
        keys.assignments,
        assignments.filter((a) => a.reportId !== id)
      )
      // Free up any booked slot
      const slots = database.getDriverAvailability().map((s) => {
        if (s.bookedByPickupId === id) {
          const freed = { ...s, isBooked: false, bookedByPickupId: undefined }
          if (isNeonConfigured) upsertNeonAvailabilitySlot(freed).catch(() => {})
          return freed
        }
        return s
      })
      write(keys.driverAvailability, slots)
    } else {
      const nextAssignments = assignments.map((a) => {
        if (a.reportId === id) {
          let nextStatus = a.status
          if (status === 'Completed') nextStatus = 'Collected'
          else if (status === 'En route') nextStatus = 'Arrived'
          else if (status === 'Accepted') nextStatus = 'Accepted'
          const updated = { ...a, status: nextStatus }
          if (isNeonConfigured) upsertNeonAssignment(updated).catch(() => {})
          return updated
        }
        return a
      })
      write(keys.assignments, nextAssignments)
    }

    if (isNeonConfigured) {
      updateNeonPickup(id, { status }).catch((err) => console.warn('Neon pickup status update error:', err))
    }

    return pickups
  },

  // Driver Availability & Shift Scheduling
  getDriverAvailability(): DriverAvailabilitySlot[] {
    const stored = read<DriverAvailabilitySlot[]>(keys.driverAvailability, [])
    if (stored.length > 0) {
      const { slots: sanitized, modified } = sanitizeAndRefreshSlots(stored)
      if (modified) {
        try {
          window.localStorage.setItem(keys.driverAvailability, JSON.stringify(sanitized))
        } catch {
          // ignore
        }
      }
      return sanitized
    }
    const seed = generateSeedDriverAvailability()
    write(keys.driverAvailability, seed)
    return seed
  },

  publishDriverAvailability(slots: DriverAvailabilitySlot[]): DriverAvailabilitySlot[] {
    write(keys.driverAvailability, slots)
    if (isNeonConfigured) {
      slots.forEach((s) => upsertNeonAvailabilitySlot(s).catch(() => {}))
    }
    return slots
  },

  addDriverAvailabilitySlot(
    slotData: Omit<DriverAvailabilitySlot, 'id' | 'isBooked'>
  ): DriverAvailabilitySlot {
    const current = database.getDriverAvailability()
    const newSlot: DriverAvailabilitySlot = {
      ...slotData,
      id: `SLOT-${Date.now().toString().slice(-6)}`,
      isBooked: false,
      createdAt: new Date().toISOString(),
    }
    write(keys.driverAvailability, [newSlot, ...current])

    if (isNeonConfigured) {
      upsertNeonAvailabilitySlot(newSlot).catch((err) =>
        console.warn('Neon availability slot insert error:', err)
      )
    }

    return newSlot
  },

  deleteDriverAvailabilitySlot(id: string): DriverAvailabilitySlot[] {
    const current = database.getDriverAvailability()
    const next = current.filter((s) => s.id !== id)
    write(keys.driverAvailability, next)

    if (isNeonConfigured) {
      deleteNeonAvailabilitySlot(id).catch((err) =>
        console.warn('Neon availability slot delete error:', err)
      )
    }

    return next
  },

  getAvailableDriversForSlot(
    date: string,
    timeSlot: string,
    lat?: number,
    lng?: number,
    location?: string
  ): DriverAvailabilitySlot[] {
    const all = database.getDriverAvailability()
    const matching = all.filter((s) => s.date === date && s.timeSlot === timeSlot && !s.isBooked)

    if (typeof lat === 'number' && typeof lng === 'number' && matching.length > 1) {
      return [...matching].sort((a, b) => {
        const distA = Math.hypot(a.lat - lat, a.lng - lng)
        const distB = Math.hypot(b.lat - lat, b.lng - lng)
        return distA - distB
      })
    }

    if (location && matching.length > 1) {
      const locClean = location.toLowerCase()
      return [...matching].sort((a, b) => {
        const matchA =
          locClean.includes(a.location.toLowerCase()) || a.location.toLowerCase().includes(locClean)
            ? -1
            : 1
        const matchB =
          locClean.includes(b.location.toLowerCase()) || b.location.toLowerCase().includes(locClean)
            ? -1
            : 1
        return matchA - matchB
      })
    }

    return matching
  },

  bookDriverSlot(slotId: string, pickupId: string): boolean {
    const current = database.getDriverAvailability()
    let found = false
    const next = current.map((s) => {
      if (s.id === slotId) {
        found = true
        const bookedSlot = { ...s, isBooked: true, bookedByPickupId: pickupId }
        if (isNeonConfigured) {
          upsertNeonAvailabilitySlot(bookedSlot).catch(() => {})
        }
        return bookedSlot
      }
      return s
    })
    if (found) {
      write(keys.driverAvailability, next)
    }
    return found
  },

  // Driver Profile & Variable Contact
  getDriverProfile(): DriverProfile {
    return read<DriverProfile>(keys.driverProfile, defaultDriverProfile)
  },

  updateDriverProfile(updates: Partial<DriverProfile>): DriverProfile {
    const current = database.getDriverProfile()
    const updated: DriverProfile = { ...current, ...updates }
    write(keys.driverProfile, updated)

    if (isNeonConfigured) {
      upsertNeonDriverProfile(updated).catch((err) =>
        console.warn('Neon driver profile update error:', err)
      )
    }

    // Synchronize newly updated driver contact & vehicle across active assignments
    const currentAssignments = database.getDriverAssignments()
    const nextAssignments = currentAssignments.map((a) => {
      if (a.driverName?.includes(current.name) || a.driverName?.includes(updated.name)) {
        const synced = {
          ...a,
          driverName: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
        if (isNeonConfigured) upsertNeonAssignment(synced).catch(() => {})
        return synced
      }
      return a
    })
    write(keys.assignments, nextAssignments)

    // Synchronize across active unbooked availability slots
    const currentSlots = database.getDriverAvailability()
    const nextSlots = currentSlots.map((s) => {
      if (!s.isBooked && (s.driverName.includes(current.name) || s.driverName.includes(updated.name))) {
        const synced = {
          ...s,
          driverName: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
        if (isNeonConfigured) upsertNeonAvailabilitySlot(synced).catch(() => {})
        return synced
      }
      return s
    })
    write(keys.driverAvailability, nextSlots)

    // Synchronize across active pickups
    const currentPickups = database.getPickups()
    const nextPickups = currentPickups.map((p) => {
      if (p.driverName?.includes(current.name) || p.driverName?.includes(updated.name)) {
        const synced = {
          ...p,
          driverName: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
        if (isNeonConfigured) updateNeonPickup(synced.id, synced).catch(() => {})
        return synced
      }
      return p
    })
    write(keys.pickups, nextPickups)

    // Synchronize across active reports
    const currentReports = database.getReports()
    const nextReports = currentReports.map((r) => {
      if (r.assignedDriver?.includes(current.name) || r.assignedDriver?.includes(updated.name)) {
        const synced = {
          ...r,
          assignedDriver: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
        if (isNeonConfigured) updateNeonReport(synced.id, synced).catch(() => {})
        return synced
      }
      return r
    })
    write(keys.reports, nextReports)

    return updated
  },

  // Driver Assignments
  getDriverAssignments(): DriverAssignment[] {
    const stored = read<DriverAssignment[]>(keys.assignments, [])
    if (stored.length > 0) return stored
    const seed = generateDefaultDriverAssignments()
    write(keys.assignments, seed)
    return seed
  },

  updateDriverAssignment(
    id: string,
    status: DriverAssignment['status'],
    proofImage?: string
  ): DriverAssignment[] {
    const assignments = database.getDriverAssignments().map((a) =>
      a.id === id ? { ...a, status, ...(proofImage ? { proofImage } : {}) } : a
    )
    write(keys.assignments, assignments)

    const assignment = assignments.find((a) => a.id === id)
    if (assignment) {
      if (isNeonConfigured) {
        upsertNeonAssignment(assignment).catch(() => {})
      }

      const isPickup = assignment.reportId.startsWith('PK-')
      if (isPickup) {
        if (status === 'Accepted') {
          database.updatePickupStatus(assignment.reportId, 'Accepted')
        } else if (status === 'Arrived') {
          database.updatePickupStatus(assignment.reportId, 'En route')
        } else if (status === 'Collected') {
          database.updatePickupStatus(assignment.reportId, 'Completed')
          database.addGreenPoints(50)
        }
      } else {
        if (status === 'Accepted') {
          database.updateReport(assignment.reportId, { status: 'Team on way' })
        } else if (status === 'Arrived') {
          database.updateReport(assignment.reportId, { status: 'In progress' })
        } else if (status === 'Collected') {
          database.updateReport(assignment.reportId, {
            status: 'Resolved',
            estimatedClearance: `Cleared (${formatClockTime()})`,
            ...(proofImage ? { proofImage } : {}),
          })
          database.addGreenPoints(50)
        }
      }
    }
    return assignments
  },

  assignReportToDriver(
    reportId: string,
    driverName: string,
    vehicleNumber: string,
    driverPhone?: string
  ) {
    const report = database.getReports().find((r) => r.id === reportId)
    const phone = driverPhone || '+91 98220 44123'
    database.updateReport(reportId, {
      status: 'Assigned',
      assignedDriver: driverName,
      vehicleNumber,
      driverPhone: phone,
    })

    const existingAssignments = database.getDriverAssignments()
    const existingIdx = existingAssignments.findIndex((a) => a.reportId === reportId)
    const nowMs = Date.now()
    const timeSlot = `Today (${formatClockTime(nowMs)} – ${formatClockTime(nowMs + 35 * 60000)})`

    if (existingIdx >= 0) {
      const updatedAssignment: DriverAssignment = {
        ...existingAssignments[existingIdx],
        driverName,
        driverPhone: phone,
        vehicleNumber,
        status: 'New',
        timeSlot,
      }
      const next = [...existingAssignments]
      next[existingIdx] = updatedAssignment
      write(keys.assignments, next)
      if (isNeonConfigured) upsertNeonAssignment(updatedAssignment).catch(() => {})
      return next
    }

    const newAssignment: DriverAssignment = {
      id: `ASG-${Date.now().toString().slice(-4)}`,
      reportId,
      type: report?.type || 'Mixed waste',
      location: report?.location || 'Pune',
      priority: report?.priority || 'Medium',
      status: 'New',
      timeSlot,
      lat: report?.lat || 18.5204,
      lng: report?.lng || 73.8567,
      distanceKm: 2.1,
      driverName,
      driverPhone: phone,
      vehicleNumber,
      citizenPhone: report?.citizenPhone || report?.reporterPhone || '+91 98220 88711',
      reportImage: report?.image,
    }

    const assignments = [newAssignment, ...existingAssignments]
    write(keys.assignments, assignments)
    if (isNeonConfigured) upsertNeonAssignment(newAssignment).catch(() => {})
    return assignments
  },

  reassignPickup(
    pickupId: string,
    driverName: string,
    vehicleNumber: string,
    driverPhone?: string
  ): StoredPickup[] {
    const phone = driverPhone || '+91 98220 44123'
    const current = database.getPickups()
    const next = current.map((p) => {
      if (p.id === pickupId) {
        const updatedPickup: StoredPickup = {
          ...p,
          driverName,
          vehicleNumber,
          driverPhone: phone,
          status: p.status === 'Requested' ? 'Accepted' : p.status,
        }
        if (isNeonConfigured) {
          updateNeonPickup(pickupId, updatedPickup).catch(() => {})
        }
        return updatedPickup
      }
      return p
    })
    write(keys.pickups, next)

    // Also update corresponding DriverAssignment
    const assignments = database.getDriverAssignments().map((a) => {
      if (a.reportId === pickupId) {
        const updated = {
          ...a,
          driverName,
          vehicleNumber,
          driverPhone: phone,
        }
        if (isNeonConfigured) upsertNeonAssignment(updated).catch(() => {})
        return updated
      }
      return a
    })
    write(keys.assignments, assignments)

    return next
  },

  // Green Points
  getGreenPoints(): number {
    return read<number>(keys.points, 1240)
  },

  addGreenPoints(amount: number): number {
    const current = database.getGreenPoints()
    const next = current + amount
    write(keys.points, next)
    return next
  },

  // Rewards
  getRewards(): EcoReward[] {
    const stored = read<EcoReward[]>(keys.rewards, [])
    if (stored.length > 0) return stored
    write(keys.rewards, defaultRewards)
    return defaultRewards
  },

  redeemReward(rewardId: string): { success: boolean; message: string; code?: string } {
    const points = database.getGreenPoints()
    const rewards = database.getRewards()
    const reward = rewards.find((r) => r.id === rewardId)

    if (!reward) return { success: false, message: 'Reward not found' }
    if (points < reward.pointsCost) {
      return {
        success: false,
        message: `Insufficient points! You need ${reward.pointsCost - points} more Green Points.`,
      }
    }

    const nextPoints = points - reward.pointsCost
    write(keys.points, nextPoints)

    const nextRewards = rewards.map((r) => (r.id === rewardId ? { ...r, claimed: true } : r))
    write(keys.rewards, nextRewards)

    const notifTime = new Date().toISOString()
    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: 'Reward Redeemed! 🎉',
      message: `You claimed "${reward.title}". Code: ${reward.code}`,
      time: formatRelativeTime(notifTime),
      createdAt: notifTime,
      read: false,
      type: 'reward',
    })

    if (isNeonConfigured) {
      updateNeonRewardClaimed(rewardId).catch((err) =>
        console.warn('Neon reward claim error:', err)
      )
    }

    return {
      success: true,
      message: `Successfully redeemed "${reward.title}"!`,
      code: reward.code,
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    const stored = read<NotificationItem[]>(keys.notifications, [])
    if (stored.length > 0) {
      return stored.map((n, idx) => {
        const fallbackCreatedAt = new Date(Date.now() - (idx + 1) * 5 * 60000).toISOString()
        const createdAt =
          n.createdAt && !isNaN(new Date(n.createdAt).getTime())
            ? n.createdAt
            : fallbackCreatedAt
        return {
          ...n,
          createdAt,
          time: formatRelativeTime(createdAt),
        }
      })
    }
    const seed = generateDefaultNotifications()
    write(keys.notifications, seed)
    return seed
  },

  addNotification(item: NotificationItem): NotificationItem[] {
    const createdAt = item.createdAt || new Date().toISOString()
    const enriched: NotificationItem = {
      ...item,
      createdAt,
      time: formatRelativeTime(createdAt),
    }
    const next = [enriched, ...database.getNotifications()]
    write(keys.notifications, next)

    if (isNeonConfigured) {
      insertNeonNotification({
        ...enriched,
        time: formatFullDateTime(createdAt) || enriched.time,
      }).catch((err) => console.warn('Neon notification insert error:', err))
    }

    return next
  },

  markNotificationRead(id: string): NotificationItem[] {
    const items = database.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n))
    write(keys.notifications, items)
    return items
  },

  markAllNotificationsRead(): NotificationItem[] {
    const items = database.getNotifications().map((n) => ({ ...n, read: true }))
    write(keys.notifications, items)
    return items
  },

  // Themes
  getTheme(): 'light' | 'dark' {
    return read<'light' | 'dark'>(keys.theme, 'light')
  },

  setTheme(theme: 'light' | 'dark') {
    write(keys.theme, theme)
  },

  // Wards
  getWards(): WardMetric[] {
    return puneWards
  },

  // Subscription
  subscribeToDatabase(listener: Listener): () => void {
    return subscribeToDatabase(listener)
  },

  // Neon PostgreSQL helpers
  isNeonConfigured(): boolean {
    return isNeonConfigured
  },

  syncFromNeon(): Promise<boolean> {
    return syncFromNeon()
  },

  checkNeonConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    return checkNeonConnection()
  },
}
