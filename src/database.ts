import type {
  StoredReport,
  StoredPickup,
  StoredUser,
  UserSession,
  UserLocationState,
  DriverAssignment,
  DriverProfile,
  EcoReward,
  NotificationItem,
  WardMetric,
} from './types'
import { formatRelativeTime } from './utils/dateUtils'
import { findNearestDriver } from './utils/fleetData'
import {
  isNeonConfigured,
  fetchNeonReports,
  insertNeonReport,
  updateNeonReport,
  deleteNeonReport,
  clearAllNeonReports,
  fetchNeonPickups,
  insertNeonPickup,
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
  rewards: 'cleanconnect.rewards.v2',
  location: 'cleanconnect.location.v2',
}

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

// Background synchronization with Neon PostgreSQL
export async function syncFromNeon(): Promise<boolean> {
  if (!isNeonConfigured) return false
  try {
    const [remoteReports, remotePickups, remoteRewards, remoteNotifications, remoteUsers] = await Promise.all([
      fetchNeonReports(),
      fetchNeonPickups(),
      fetchNeonRewards(),
      fetchNeonNotifications(),
      fetchNeonUsers(),
    ])

    let changed = false
    if (remoteReports && remoteReports.length > 0) {
      write(keys.reports, remoteReports)
      changed = true
    }
    if (remotePickups && remotePickups.length > 0) {
      write(keys.pickups, remotePickups)
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
      write(keys.users, remoteUsers)
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
      icon: 'MW',
      description: 'Unsorted commercial boxes and domestic plastic accumulated near pedestrian crossing.',
      assignedDriver: 'Ravi K. (Crew #4)',
      vehicleNumber: 'MH 12 AB 2840',
      estimatedClearance: 'Within 45 mins',
      createdAt: new Date(now - 22 * 60 * 1000).toISOString(), // 22 mins ago
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
      icon: 'PP',
      description: 'Single-use packaging, plastic bottles, and snack wrappers left near park pathway.',
      assignedDriver: 'Ravi K. (Crew #4)',
      vehicleNumber: 'MH 12 AB 2840',
      estimatedClearance: '15 mins',
      createdAt: new Date(now - 55 * 60 * 1000).toISOString(), // 55 mins ago
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
      icon: 'OB',
      description: 'Public bin at capacity; roadside spillage onto jogging lane. Rapid clearance requested.',
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(), // 2 hours ago
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
      icon: 'CD',
      description: 'Broken concrete slabs and demolition plaster obstructing residential entry. Cleared by PMC Heavy Squad.',
      assignedDriver: 'PMC Heavy Squad #1',
      vehicleNumber: 'MH 12 TR 4012',
      createdAt: new Date(now - 24 * 3600 * 1000).toISOString(), // 1 day ago
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
      icon: 'OW',
      description: 'Vegetable leaves and organic wet waste diverted directly to PMC bio-methanation plant.',
      assignedDriver: 'Bio Waste Squad #2',
      vehicleNumber: 'MH 12 BW 1102',
      createdAt: new Date(now - 48 * 3600 * 1000).toISOString(), // 2 days ago
      greenPointsAwarded: 50,
    },
  ]
}

export function generatePuneSeedPickups(): StoredPickup[] {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  return [
    {
      id: 'PK-2026-004120',
      type: 'Society / apartment waste',
      address: 'Bluebell Heights, Near Symbiosis, Viman Nagar, Pune',
      contact: '+91 98220 12345',
      status: 'En route',
      date: tomorrow,
      timeSlot: '08:00 – 10:00 AM',
      quantity: '25–50 kg',
      instructions: 'Gate 2 security will guide driver to basement segregated collection room.',
      vehicleNumber: 'MH 12 AB 2840',
      driverName: 'Ravi K.',
      etaMinutes: 14,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
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

export const defaultDriverAssignments: DriverAssignment[] = [
  {
    id: 'ASG-201',
    reportId: 'CW-2026-009102',
    type: 'Mixed waste (Commercial)',
    location: 'FC Road, Near Goodluck Cafe, Pune',
    priority: 'High',
    status: 'New',
    timeSlot: '11:00 AM – 11:30 AM',
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
    type: 'Society pickup (50kg segregated)',
    location: 'Bluebell Heights, Viman Nagar, Pune',
    priority: 'Medium',
    status: 'Accepted',
    timeSlot: '11:30 AM – 12:15 PM',
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
    timeSlot: '12:30 PM – 01:00 PM',
    lat: 18.5679,
    lng: 73.9143,
    distanceKm: 5.2,
    driverName: 'Ravi Kumar',
    driverPhone: '+91 98220 44123',
    vehicleNumber: 'MH 12 AB 2840',
    citizenPhone: '+91 98220 33419',
  },
]

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

export const defaultNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    title: 'Collection vehicle dispatched',
    message: 'Driver Ravi K. (MH 12 AB 2840) is en route. Estimated arrival in 14 mins.',
    time: '12 min ago',
    read: false,
    type: 'pickup',
  },
  {
    id: 'NOTIF-02',
    title: 'CleanConnect Online',
    message: 'Welcome to CleanConnect. Live GPS coordinates and reports are active.',
    time: 'Just now',
    read: false,
    type: 'system',
  },
]

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
  },
  {
    name: 'Avantika Kumar',
    email: 'avantika.k@pune-clean.gov.in',
    password: 'password123',
    role: 'Citizen',
    ward: 'Kothrud - Bavdhan (PMC Ward 2)',
    city: 'Pune',
    greenPoints: 2150,
  },
  {
    name: 'Driver Ravi Kumar',
    email: 'driver.ravi@cleanconnect.pune',
    password: 'password123',
    role: 'Driver',
    city: 'Pune',
  },
  {
    name: 'Supervisor Deshmukh',
    email: 'admin.deshmukh@cleanconnect.pune',
    password: 'password123',
    role: 'Admin',
    city: 'Pune',
  },
]

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
    if (stored.length > 0) return stored
    write(keys.users, defaultUsers)
    return defaultUsers
  },

  register(user: StoredUser): UserSession {
    const existing = database.getUsers()
    const next = [...existing.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase()), user]
    write(keys.users, next)

    const session: UserSession = {
      name: user.name,
      email: user.email,
      role: user.role || 'Citizen',
      city: user.city || database.getLocation().city,
    }
    write(keys.session, session)

    if (isNeonConfigured) {
      insertNeonUser(user).catch((err) => console.warn('Neon user insert error:', err))
    }

    return session
  },

  signIn(email: string, password: string): UserSession | null {
    const user = database
      .getUsers()
      .find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password)
    if (!user) return null

    const session: UserSession = {
      name: user.name,
      email: user.email,
      role: user.role || 'Citizen',
      city: user.city || database.getLocation().city,
    }
    write(keys.session, session)
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
      updateNeonUserProfile(email, name, city).catch((err) => console.warn('Neon user profile update error:', err))
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
      // Dynamically populate relative time
      return stored.map((r) => ({ ...r, time: formatRelativeTime(r.createdAt) }))
    }
    const seed = generatePuneSeedReports()
    write(keys.reports, seed)
    return seed.map((r) => ({ ...r, time: formatRelativeTime(r.createdAt) }))
  },

  addReport(report: StoredReport): StoredReport {
    // 1. Smart Municipal Auto-Dispatch (citizen never needs to provide driver number)
    const activeDriver = database.getDriverProfile()
    const driver = findNearestDriver(report.lat, report.lng, activeDriver)
    const enrichedReport: StoredReport = {
      ...report,
      status: report.status === 'Submitted' ? 'Assigned' : report.status,
      assignedDriver: report.assignedDriver || driver.name,
      vehicleNumber: report.vehicleNumber || driver.vehicleNumber,
      driverPhone: report.driverPhone || driver.phone,
      estimatedClearance: report.estimatedClearance || 'Today in ~35 mins',
    }

    const currentReports = read<StoredReport[]>(keys.reports, [])
    const next = [enrichedReport, ...currentReports]
    write(keys.reports, next)
    database.addGreenPoints(50)

    // 2. Automatically dispatch route stop to driver's queue
    const distanceKm =
      Math.round(
        Math.hypot(
          driver.lat - (enrichedReport.lat || 18.5204),
          driver.lng - (enrichedReport.lng || 73.8567)
        ) * 111 * 10
      ) / 10 || 1.4

    const newAssignment: DriverAssignment = {
      id: `ASG-${Date.now().toString().slice(-4)}`,
      reportId: enrichedReport.id,
      type: enrichedReport.type,
      location: enrichedReport.location,
      priority: enrichedReport.priority,
      status: 'New',
      timeSlot: 'Live Dispatch (ETA 35m)',
      lat: enrichedReport.lat || 18.5204,
      lng: enrichedReport.lng || 73.8567,
      distanceKm,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      citizenPhone: enrichedReport.reporterEmail || '+91 98220 88711',
      reportImage: enrichedReport.image,
    }
    const currentAssignments = read<DriverAssignment[]>(keys.assignments, defaultDriverAssignments)
    write(keys.assignments, [newAssignment, ...currentAssignments])

    // 3. Notify citizen with assigned driver contact & vehicle
    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: '🚛 Municipal Driver Dispatched!',
      message: `${driver.name} (${driver.vehicleNumber}) has been assigned to ${enrichedReport.id}. Contact: ${driver.phone}. ETA: ~35 mins.`,
      time: 'Just now',
      read: false,
      type: 'report',
    })

    if (isNeonConfigured) {
      insertNeonReport(enrichedReport).catch((err) => console.warn('Neon report insert error:', err))
    }

    return enrichedReport
  },

  updateReport(id: string, updates: Partial<StoredReport>): StoredReport[] {
    const reports = read<StoredReport[]>(keys.reports, []).map((r) => (r.id === id ? { ...r, ...updates } : r))
    write(keys.reports, reports)

    if (isNeonConfigured) {
      updateNeonReport(id, updates).catch((err) => console.warn('Neon report update error:', err))
    }

    return reports
  },

  deleteReport(id: string): StoredReport[] {
    const reports = read<StoredReport[]>(keys.reports, []).filter((r) => r.id !== id)
    write(keys.reports, reports)

    if (isNeonConfigured) {
      deleteNeonReport(id).catch((err) => console.warn('Neon report delete error:', err))
    }

    return reports
  },

  clearAllReports(): StoredReport[] {
    write(keys.reports, [])

    if (isNeonConfigured) {
      clearAllNeonReports().catch((err) => console.warn('Neon reports clear error:', err))
    }

    return []
  },

  resetDemoReports(_city = 'Pune'): StoredReport[] {
    const seed = generatePuneSeedReports()
    write(keys.reports, seed)
    return seed
  },

  // Pickups
  getPickups(): StoredPickup[] {
    const stored = read<StoredPickup[]>(keys.pickups, [])
    if (stored.length > 0) return stored
    const seed = generatePuneSeedPickups()
    write(keys.pickups, seed)
    return seed
  },

  addPickup(pickup: StoredPickup): StoredPickup {
    // 1. Resolve coordinates & address
    const userLoc = database.getLocation()
    const lat = pickup.lat || userLoc.lat || 18.5204
    const lng = pickup.lng || userLoc.lng || 73.8567

    // 2. Municipal Fleet Auto-Dispatch & Nearest Driver Matching
    const activeDriver = database.getDriverProfile()
    const driver = findNearestDriver(lat, lng, activeDriver)

    const distanceKm =
      Math.round(
        Math.hypot(
          driver.lat - lat,
          driver.lng - lng
        ) * 111 * 10
      ) / 10 || 2.4

    const etaMinutes = pickup.etaMinutes || Math.max(12, Math.round(distanceKm * 4 + 8))

    const enrichedPickup: StoredPickup = {
      ...pickup,
      lat,
      lng,
      status: 'Accepted',
      driverName: pickup.driverName && pickup.driverName !== 'Pending assignment' ? pickup.driverName : driver.name,
      driverPhone: pickup.driverPhone || driver.phone,
      vehicleNumber: pickup.vehicleNumber || driver.vehicleNumber,
      etaMinutes,
    }

    const current = database.getPickups()
    const next = [enrichedPickup, ...current]
    write(keys.pickups, next)

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
    const currentAssignments = read<DriverAssignment[]>(keys.assignments, defaultDriverAssignments)
    write(keys.assignments, [newAssignment, ...currentAssignments])

    // 4. Send citizen notification with Driver name, vehicle number, and variable phone
    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: '🚛 Collection Vehicle Assigned!',
      message: `Driver ${enrichedPickup.driverName} (${enrichedPickup.vehicleNumber}) has been assigned for ${enrichedPickup.date} (${enrichedPickup.timeSlot}). Driver Phone: ${enrichedPickup.driverPhone}. ETA: ~${etaMinutes} mins.`,
      time: 'Just now',
      read: false,
      type: 'pickup',
    })

    if (isNeonConfigured) {
      insertNeonPickup(enrichedPickup).catch((err) => console.warn('Neon pickup insert error:', err))
    }

    return enrichedPickup
  },

  // Driver Profile & Variable Contact
  getDriverProfile(): DriverProfile {
    return read<DriverProfile>(keys.driverProfile, defaultDriverProfile)
  },

  updateDriverProfile(updates: Partial<DriverProfile>): DriverProfile {
    const current = database.getDriverProfile()
    const updated: DriverProfile = { ...current, ...updates }
    write(keys.driverProfile, updated)

    // Synchronize newly updated driver contact & vehicle across active assignments
    const currentAssignments = read<DriverAssignment[]>(keys.assignments, defaultDriverAssignments)
    const nextAssignments = currentAssignments.map((a) => {
      if (a.driverName?.includes(current.name) || a.driverName?.includes(updated.name)) {
        return {
          ...a,
          driverName: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
      }
      return a
    })
    write(keys.assignments, nextAssignments)

    // Synchronize across active pickups
    const currentPickups = read<StoredPickup[]>(keys.pickups, [])
    const nextPickups = currentPickups.map((p) => {
      if (p.driverName?.includes(current.name) || p.driverName?.includes(updated.name)) {
        return {
          ...p,
          driverName: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
      }
      return p
    })
    write(keys.pickups, nextPickups)

    // Synchronize across active reports
    const currentReports = read<StoredReport[]>(keys.reports, [])
    const nextReports = currentReports.map((r) => {
      if (r.assignedDriver?.includes(current.name) || r.assignedDriver?.includes(updated.name)) {
        return {
          ...r,
          assignedDriver: updated.name,
          driverPhone: updated.phone,
          vehicleNumber: updated.vehicleNumber,
        }
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
    write(keys.assignments, defaultDriverAssignments)
    return defaultDriverAssignments
  },

  updateDriverAssignment(id: string, status: DriverAssignment['status'], proofImage?: string): DriverAssignment[] {
    const assignments = database.getDriverAssignments().map((a) =>
      a.id === id ? { ...a, status, ...(proofImage ? { proofImage } : {}) } : a
    )
    write(keys.assignments, assignments)

    const assignment = assignments.find((a) => a.id === id)
    if (assignment) {
      if (status === 'Accepted') {
        database.updateReport(assignment.reportId, { status: 'Team on way' })
      } else if (status === 'Arrived') {
        database.updateReport(assignment.reportId, { status: 'In progress' })
      } else if (status === 'Collected') {
        database.updateReport(assignment.reportId, { status: 'Resolved' })
      }
    }
    return assignments
  },

  assignReportToDriver(reportId: string, driverName: string, vehicleNumber: string, driverPhone?: string) {
    const report = database.getReports().find((r) => r.id === reportId)
    const phone = driverPhone || '+91 98220 44123'
    database.updateReport(reportId, {
      status: 'Assigned',
      assignedDriver: driverName,
      vehicleNumber,
      driverPhone: phone,
    })

    const newAssignment: DriverAssignment = {
      id: `ASG-${Date.now().toString().slice(-4)}`,
      reportId,
      type: report?.type || 'Mixed waste',
      location: report?.location || 'Pune',
      priority: report?.priority || 'Medium',
      status: 'New',
      timeSlot: 'Today',
      lat: report?.lat || 18.5204,
      lng: report?.lng || 73.8567,
      distanceKm: 2.1,
      driverName,
      driverPhone: phone,
      vehicleNumber,
      reportImage: report?.image,
    }

    const assignments = [newAssignment, ...database.getDriverAssignments()]
    write(keys.assignments, assignments)
    return assignments
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
      return { success: false, message: `Insufficient points! You need ${reward.pointsCost - points} more Green Points.` }
    }

    const nextPoints = points - reward.pointsCost
    write(keys.points, nextPoints)

    const nextRewards = rewards.map((r) => (r.id === rewardId ? { ...r, claimed: true } : r))
    write(keys.rewards, nextRewards)

    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: 'Reward Redeemed! 🎉',
      message: `You claimed "${reward.title}". Code: ${reward.code}`,
      time: 'Just now',
      read: false,
      type: 'reward',
    })

    if (isNeonConfigured) {
      updateNeonRewardClaimed(rewardId).catch((err) => console.warn('Neon reward claim error:', err))
    }

    return { success: true, message: `Successfully redeemed "${reward.title}"!`, code: reward.code }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    const stored = read<NotificationItem[]>(keys.notifications, [])
    if (stored.length > 0) return stored
    write(keys.notifications, defaultNotifications)
    return defaultNotifications
  },

  addNotification(item: NotificationItem): NotificationItem[] {
    const next = [item, ...database.getNotifications()]
    write(keys.notifications, next)

    if (isNeonConfigured) {
      insertNeonNotification(item).catch((err) => console.warn('Neon notification insert error:', err))
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
