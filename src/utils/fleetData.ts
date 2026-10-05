/**
 * Municipal Fleet Drivers and GIS Auto-Dispatch Engine
 * Multi-city fleet coverage with dynamic driver contact & vehicle resolution.
 */

export interface MunicipalDriver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  city: string
  zone: string
  lat: number
  lng: number
  status: 'Available' | 'On Duty' | 'Busy'
}

export const municipalDrivers: MunicipalDriver[] = [
  // Pune Fleet
  {
    id: 'DRV-P1',
    name: 'Ravi Kumar',
    phone: '+91 98220 44123',
    vehicleNumber: 'MH 12 AB 2840',
    city: 'Pune',
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
    city: 'Pune',
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
    city: 'Pune',
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
    city: 'Pune',
    zone: 'Viman Nagar & Hadapsar',
    lat: 18.5679,
    lng: 73.9143,
    status: 'Available',
  },

  // Mumbai Fleet
  {
    id: 'DRV-M1',
    name: 'Santosh Shinde',
    phone: '+91 98201 33412',
    vehicleNumber: 'MH 02 CC 1024',
    city: 'Mumbai',
    zone: 'Andheri West & Juhu',
    lat: 19.1136,
    lng: 72.8697,
    status: 'Available',
  },
  {
    id: 'DRV-M2',
    name: 'Ganesh More',
    phone: '+91 98205 77890',
    vehicleNumber: 'MH 01 DD 5621',
    city: 'Mumbai',
    zone: 'Bandra & Dadar',
    lat: 19.0596,
    lng: 72.8295,
    status: 'Available',
  },

  // Bengaluru Fleet
  {
    id: 'DRV-B1',
    name: 'Manjunath Gowda',
    phone: '+91 98450 12893',
    vehicleNumber: 'KA 01 MJ 4401',
    city: 'Bengaluru',
    zone: 'Indiranagar & MG Road',
    lat: 12.9784,
    lng: 77.6408,
    status: 'Available',
  },
  {
    id: 'DRV-B2',
    name: 'Kiran Reddy',
    phone: '+91 98455 98124',
    vehicleNumber: 'KA 03 KL 7712',
    city: 'Bengaluru',
    zone: 'Koramangala & HSR',
    lat: 12.9352,
    lng: 77.6245,
    status: 'Available',
  },

  // Delhi NCR Fleet
  {
    id: 'DRV-D1',
    name: 'Rajesh Verma',
    phone: '+91 98110 55432',
    vehicleNumber: 'DL 1C AA 3012',
    city: 'Delhi NCR',
    zone: 'Connaught Place & Central',
    lat: 28.6315,
    lng: 77.2167,
    status: 'Available',
  },
  {
    id: 'DRV-D2',
    name: 'Virender Singh',
    phone: '+91 98112 66781',
    vehicleNumber: 'DL 2C BB 8819',
    city: 'Delhi NCR',
    zone: 'South Delhi & Saket',
    lat: 28.5245,
    lng: 77.2066,
    status: 'Available',
  },
]

/**
 * Finds the nearest municipal driver based on GIS distance.
 * If an active driver profile exists, it overrides the default driver contact
 * so the driver's custom phone number and vehicle registration are always used.
 */
export function findNearestDriver(
  targetLat?: number,
  targetLng?: number,
  activeDriverOverride?: { name?: string; phone?: string; vehicleNumber?: string }
): MunicipalDriver {
  let matched = municipalDrivers[0]

  if (typeof targetLat === 'number' && typeof targetLng === 'number' && !isNaN(targetLat) && !isNaN(targetLng)) {
    let minDistance = Infinity

    for (const driver of municipalDrivers) {
      const dist = Math.hypot(driver.lat - targetLat, driver.lng - targetLng)
      if (dist < minDistance) {
        minDistance = dist
        matched = driver
      }
    }
  }

  // Apply variable driver profile overrides if provided
  if (activeDriverOverride) {
    return {
      ...matched,
      name: activeDriverOverride.name || matched.name,
      phone: activeDriverOverride.phone || matched.phone,
      vehicleNumber: activeDriverOverride.vehicleNumber || matched.vehicleNumber,
    }
  }

  return matched
}
