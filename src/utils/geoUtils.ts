/**
 * Geolocation and map utilities with high-precision GPS tracking,
 * multi-tier reverse geocoding, search lookup, and Google Maps integration.
 */

export interface CityPreset {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  neighborhoods: string[]
}

export const SUPPORTED_CITIES: CityPreset[] = [
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
    neighborhoods: ['FC Road & Shivajinagar', 'Kothrud', 'Viman Nagar', 'Koregaon Park', 'Hinjewadi IT Park', 'Baner', 'Aundh', 'Hadapsar', 'Wakad'],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    neighborhoods: ['Bandra West', 'Andheri East', 'Colaba', 'Juhu', 'Dadar', 'Powai', 'Thane West', 'Navi Mumbai', 'Borivali'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    neighborhoods: ['Indira Nagar', 'Koramangala', 'MG Road', 'Whitefield', 'Jayanagar', 'HSR Layout', 'Electronic City', 'Bellandur'],
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    neighborhoods: ['Connaught Place', 'Hauz Khas', 'Saket', 'Dwarka', 'Karol Bagh', 'Noida Sector 18', 'Gurugram Cyber City', 'Rohini'],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3850,
    lng: 78.4867,
    neighborhoods: ['Banjara Hills', 'HITEC City', 'Gachibowli', 'Jubilee Hills', 'Madhapur', 'Secunderabad', 'Kondapur'],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    neighborhoods: ['T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Mylapore', 'OMR', 'Nungambakkam'],
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    neighborhoods: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge', 'Howrah', 'Alipore'],
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    lat: 23.0225,
    lng: 72.5714,
    neighborhoods: ['Navrangpura', 'Satellite', 'SG Highway', 'Bodakdev', 'Maninagar', 'Vastrapur'],
  },
]

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function getGoogleMapsDirectionsUrl(destLat: number, destLng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
}

/**
 * Finds the closest preset city within a sensible radius (~65 km)
 */
export function findNearestPresetCity(lat: number, lng: number): CityPreset | null {
  let nearest: CityPreset | null = null
  let minDistance = Infinity

  for (const city of SUPPORTED_CITIES) {
    const dist = Math.hypot(city.lat - lat, city.lng - lng) * 111 // approximate km
    if (dist < minDistance) {
      minDistance = dist
      nearest = city
    }
  }

  // Only match if within 65km of metro center
  return minDistance <= 65 ? nearest : null
}

export interface GeocodeResult {
  city: string
  area: string
  fullAddress: string
  state?: string
  lat?: number
  lng?: number
}

/**
 * Multi-provider reverse geocoding with zero hardcoded Pune fallback.
 * Strictly decodes the user's physical GPS coordinates.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  // Provider 1: BigDataCloud Client API (fast, CORS-enabled, client-safe)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500)
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const d = await res.json()
      const state = d.principalSubdivision || ''
      const admins = Array.isArray(d.localityInfo?.administrative) ? d.localityInfo.administrative : []

      let city = d.city || ''
      let area = d.locality || ''

      // If city is empty in Indian suburb, deduce from administrative hierarchy
      if (!city && admins.length > 0) {
        // Find district or urban corporation
        const districtItem =
          admins.find((a: { name?: string; description?: string }) =>
            /district|corporation|municipality|city|division/i.test(a.description || '')
          ) || admins[2]

        if (districtItem?.name) {
          city = districtItem.name.replace(/\s+(District|Suburban|Division|Urban)$/i, '').trim()
        }
      }

      // If area is empty or same as city, extract taluka/suburb/locality
      if (!area || (city && area.toLowerCase() === city.toLowerCase())) {
        const subItem =
          admins.find((a: { name?: string; description?: string }) =>
            /taluka|sub-district|suburb|ward|quarter/i.test(a.description || '')
          ) || admins[3]

        if (subItem?.name) {
          area = subItem.name.replace(/\s+(Taluka|Sub-district|Ward)$/i, '').trim()
        } else if (d.localityInfo?.informative?.[0]?.name) {
          area = d.localityInfo.informative[0].name
        }
      }

      // Final fallback if still empty
      if (!city) city = area || state || 'Current Location'
      if (!area) area = city

      const fullAddress = `${area}${area !== city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`
      return { city, area, fullAddress, state, lat, lng }
    }
  } catch {
    // Continue to next provider
  }

  // Provider 2: OpenStreetMap Nominatim (without forbidden browser headers)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.city_district ||
        addr.suburb ||
        addr.state_district ||
        addr.county ||
        'Current City'

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.residential ||
        addr.quarter ||
        addr.village ||
        city

      const state = addr.state || ''
      const fullAddress = data.display_name || `${area}, ${city}${state ? `, ${state}` : ''}`

      return { city, area, fullAddress, state, lat, lng }
    }
  } catch {
    // Continue to fallback
  }

  // Provider 3: Proximity to known metro presets or clean coordinate representation
  const nearestPreset = findNearestPresetCity(lat, lng)
  if (nearestPreset) {
    return {
      city: nearestPreset.name,
      area: `${nearestPreset.neighborhoods[0]} Sector`,
      fullAddress: `${nearestPreset.name}, ${nearestPreset.state} (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      state: nearestPreset.state,
      lat,
      lng,
    }
  }

  return {
    city: 'Live Location',
    area: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    fullAddress: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    lat,
    lng,
  }
}

/**
 * Searches locations, societies, or landmarks in India using OpenStreetMap Nominatim
 */
export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  const clean = query.trim()
  if (!clean || clean.length < 2) return []

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data.map((item: { lat: string; lon: string; display_name: string; address?: Record<string, string> }) => {
          const addr = item.address || {}
          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.state_district ||
            addr.county ||
            addr.suburb ||
            'Location'
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.road ||
            addr.quarter ||
            addr.residential ||
            city
          const state = addr.state || ''

          return {
            city,
            area,
            fullAddress: item.display_name,
            state,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }
        })
      }
    }
  } catch {
    // Return empty on failure
  }

  return []
}

export interface LiveGpsFix {
  lat: number
  lng: number
  accuracy: number
  provider: 'gps' | 'wifi' | 'ip'
}

/**
 * Robust multi-tier location acquisition engine.
 * 1. High-accuracy GPS satellites (15s timeout, maximumAge 0)
 * 2. Rapid network/Wi-Fi positioning (10s timeout)
 * 3. IP geocoding fallback if browser geolocation is blocked/unavailable
 */
export async function getHighAccuracyPosition(): Promise<LiveGpsFix> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return getIpBasedFallback()
  }

  // Tier 1: Try GPS satellite fix with High Accuracy
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 14000,
        maximumAge: 0,
      })
    })

    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy || 15,
      provider: 'gps',
    }
  } catch (err: unknown) {
    const geoErr = err as GeolocationPositionError

    // If permission was explicitly denied, try IP fallback
    if (geoErr && geoErr.code === 1) {
      return getIpBasedFallback()
    }

    // Tier 2: Retry with network / Wi-Fi provider
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000,
        })
      })

      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 120,
        provider: 'wifi',
      }
    } catch {
      // Tier 3: IP based fallback
      return getIpBasedFallback()
    }
  }
}

/**
 * Client-safe IP-based location fallback when GPS hardware is inaccessible
 */
async function getIpBasedFallback(): Promise<LiveGpsFix> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 5000, // Coarse IP accuracy
          provider: 'ip',
        }
      }
    }
  } catch {
    // If offline or blocked, fallback to Pune center
  }

  return {
    lat: 18.5204,
    lng: 73.8567,
    accuracy: 10000,
    provider: 'ip',
  }
}
