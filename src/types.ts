export type WasteCategory =
  | 'Mixed waste'
  | 'Plastic & packaging'
  | 'Organic waste'
  | 'Construction debris'
  | 'Electronic / E-waste'
  | 'Hazardous waste'

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ReportStatus = 'Submitted' | 'Assigned' | 'Team on way' | 'In progress' | 'Resolved'

export interface StoredReport {
  id: string
  type: string
  category: WasteCategory
  location: string
  addressDetails?: string
  lat?: number
  lng?: number
  status: ReportStatus
  priority: ReportPriority
  time?: string
  icon: string
  description?: string
  image?: string
  proofImage?: string
  assignedDriver?: string
  vehicleNumber?: string
  driverPhone?: string
  reporterName?: string
  reporterEmail?: string
  createdAt: string
  estimatedClearance?: string
  greenPointsAwarded?: number
}

export type PickupStatus = 'Requested' | 'Accepted' | 'En route' | 'Completed' | 'Cancelled'

export interface StoredPickup {
  id: string
  type: string
  address: string
  contact: string
  status: PickupStatus
  date: string
  timeSlot: string
  quantity: string
  instructions?: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  etaMinutes?: number
  lat?: number
  lng?: number
  createdAt: string
}

export interface DriverProfile {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  vehicleType: string
  zone: string
  depot: string
  status: 'On Duty' | 'Available' | 'Off Duty'
}

export interface StoredUser {
  name: string
  email: string
  password: string
  role?: 'Citizen' | 'Driver' | 'Admin'
  greenPoints?: number
  createdAt?: string
  city?: string
  ward?: string
}

export interface UserSession {
  name: string
  email: string
  role: 'Citizen' | 'Driver' | 'Admin'
  city?: string
  ward?: string
}

export interface UserLocationState {
  city: string
  area: string
  lat: number
  lng: number
  isLiveGps: boolean
}

export interface DriverAssignment {
  id: string
  reportId: string
  type: string
  location: string
  priority: ReportPriority
  status: 'New' | 'Accepted' | 'Arrived' | 'Collected'
  timeSlot?: string
  lat: number
  lng: number
  distanceKm: number
  proofImage?: string
  driverName?: string
  driverPhone?: string
  vehicleNumber?: string
  reportImage?: string
  citizenPhone?: string
}

export interface EcoReward {
  id: string
  title: string
  category: 'Discount' | 'Eco Gear' | 'Tree Planting' | 'Rebate'
  pointsCost: number
  icon: string
  description: string
  code?: string
  claimed?: boolean
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'pickup' | 'report' | 'reward' | 'system'
  actionUrl?: string
  createdAt?: string
}

export interface WardMetric {
  id: string
  name: string
  cleanlinessScore: number
  openReports: number
  resolvedToday: number
  activeFleet: number
  status: 'Optimal' | 'Attention' | 'Critical'
}
