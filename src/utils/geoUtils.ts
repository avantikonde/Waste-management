/**
 * Geolocation and map utilities with Google Maps integration
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
    neighborhoods: ['FC Road & Shivajinagar', 'Kothrud', 'Viman Nagar', 'Koregaon Park', 'Hinjewadi IT Park', 'Baner', 'Aundh'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    neighborhoods: ['Indira Nagar', 'Koramangala', 'MG Road', 'Whitefield', 'Jayanagar', 'HSR Layout'],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    neighborhoods: ['Bandra West', 'Andheri East', 'Colaba', 'Juhu', 'Dadar', 'Powai'],
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    neighborhoods: ['Connaught Place', 'Hauz Khas', 'Saket', 'Dwarka', 'Karol Bagh'],
  },
]

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function getGoogleMapsDirectionsUrl(destLat: number, destLng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; area: string; fullAddress: string }> {
  // 1. First try BigDataCloud client API (fast, reliable in browsers, no CORS restrictions)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const d = await res.json()
      const city = d.city || d.locality || d.principalSubdivision || 'Pune'
      const area = d.locality && d.locality !== d.city ? d.locality : (d.localityInfo?.administrative?.[3]?.name || d.locality || 'Current Area')
      const state = d.principalSubdivision || ''
      return {
        city,
        area,
        fullAddress: `${area}, ${city}${state ? `, ${state}` : ''}`,
      }
    }
  } catch {
    // Continue to next provider
  }

  // 2. Next try OpenStreetMap Nominatim
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'CleanConnectCivicApp/1.0' },
      }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Pune'
      const area = addr.suburb || addr.neighbourhood || addr.road || addr.quarter || 'Local Area'
      return {
        city,
        area,
        fullAddress: data.display_name || `${area}, ${city}`,
      }
    }
  } catch {
    // Graceful fallback based on coordinates
  }

  // 3. Fallback using exact GPS coordinate representation
  return {
    city: 'Current Location',
    area: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    fullAddress: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
  }
}
