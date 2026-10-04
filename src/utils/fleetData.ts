/**
 * Municipal Fleet Drivers and GIS Auto-Dispatch Engine
 */

export interface MunicipalDriver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  zone: string
  lat: number
  lng: number
  status: 'Available' | 'On Duty' | 'Busy'
}

export const municipalDrivers: MunicipalDriver[] = [
  {
    id: 'DRV-P1',
    name: 'Ravi Kumar',
    phone: '+91 98220 44123',
    vehicleNumber: 'MH 12 AB 2840',
    zone: 'Swargate & Sadashiv Peth',
    lat: 18.5018,
    lng: 73.8584,
    status: 'Available',
  },
  {
    id: 'DRV-P2',
    name: 'Suresh Patil',
    phone: '+91 98221 55678',
    vehicleNumber: 'MH 12 CD 3912',
    zone: 'Shivajinagar & FC Road',
    lat: 18.5308,
    lng: 73.8475,
    status: 'Available',
  },
  {
    id: 'DRV-P3',
    name: 'Nitin Pawar',
    phone: '+91 98224 88712',
    vehicleNumber: 'MH 12 EF 7721',
    zone: 'Kothrud & Karve Nagar',
    lat: 18.5074,
    lng: 73.8077,
    status: 'Available',
  },
  {
    id: 'DRV-P4',
    name: 'Amit Deshmukh',
    phone: '+91 98229 11984',
    vehicleNumber: 'MH 12 GH 9034',
    zone: 'Viman Nagar & Hadapsar',
    lat: 18.5679,
    lng: 73.9143,
    status: 'Available',
  },
]

/**
 * Finds the nearest municipal driver based on GIS distance
 */
export function findNearestDriver(targetLat?: number, targetLng?: number): MunicipalDriver {
  if (typeof targetLat !== 'number' || typeof targetLng !== 'number' || isNaN(targetLat) || isNaN(targetLng)) {
    return municipalDrivers[0]
  }

  let nearest = municipalDrivers[0]
  let minDistance = Infinity

  for (const driver of municipalDrivers) {
    const dist = Math.hypot(driver.lat - targetLat, driver.lng - targetLng)
    if (dist < minDistance) {
      minDistance = dist
      nearest = driver
    }
  }

  return nearest
}

