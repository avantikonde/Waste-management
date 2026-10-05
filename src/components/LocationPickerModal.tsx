import { useState, useEffect } from 'react'
import { MapPin, Search, Navigation, X, Check, Satellite, Compass } from 'lucide-react'
import {
  SUPPORTED_CITIES,
  getHighAccuracyPosition,
  reverseGeocode,
  searchLocation,
  type GeocodeResult,
} from '../utils/geoUtils'
import { database, type UserLocationState } from '../database'

interface LocationPickerModalProps {
  onClose: () => void
  onSelectLocation: (loc: UserLocationState) => void
  onToast: (msg: string) => void
}

export function LocationPickerModal({
  onClose,
  onSelectLocation,
  onToast,
}: LocationPickerModalProps) {
  const currentLoc = database.getLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAcquiringGps, setIsAcquiringGps] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)

  // Debounced address search via Nominatim
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      if (!active) return
      setIsSearching(true)
      const results = await searchLocation(searchQuery)
      if (active) {
        setSearchResults(results)
        setIsSearching(false)
      }
    }, 450)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  const handleQueryChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Direct high-accuracy satellite GPS fix
  const handleAcquireGps = async () => {
    setIsAcquiringGps(true)
    onToast('🛰️ Connecting to GPS satellites for real-time coordinates...')

    try {
      const fix = await getHighAccuracyPosition()
      setGpsAccuracy(fix.accuracy)
      const geo = await reverseGeocode(fix.lat, fix.lng)

      const liveLoc: UserLocationState = {
        city: geo.city,
        area: geo.area,
        lat: fix.lat,
        lng: fix.lng,
        isLiveGps: true,
      }

      database.setLocation(liveLoc)
      onSelectLocation(liveLoc)
      onToast(`📍 Live GPS Fix Confirmed: ${geo.area}, ${geo.city} (±${Math.round(fix.accuracy)}m)`)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      onToast(`Could not acquire GPS fix: ${message}. Try searching your address below.`)
    } finally {
      setIsAcquiringGps(false)
    }
  }

  const handleSelectSearchResult = (res: GeocodeResult) => {
    const newLoc: UserLocationState = {
      city: res.city,
      area: res.area,
      lat: res.lat || currentLoc.lat,
      lng: res.lng || currentLoc.lng,
      isLiveGps: false,
    }
    database.setLocation(newLoc)
    onSelectLocation(newLoc)
    onToast(`📍 Location set to: ${res.area}, ${res.city}`)
    onClose()
  }

  const handleSelectPresetCity = async (cityId: string) => {
    const preset = SUPPORTED_CITIES.find((c) => c.id === cityId)
    if (!preset) return

    const newLoc: UserLocationState = {
      city: preset.name,
      area: preset.neighborhoods[0],
      lat: preset.lat,
      lng: preset.lng,
      isLiveGps: false,
    }
    database.setLocation(newLoc)
    onSelectLocation(newLoc)
    onToast(`📍 Switched city to ${preset.name} (${preset.neighborhoods[0]})`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: '540px' }} role="dialog" aria-modal="true" aria-labelledby="loc-modal-title">
        <div className="modal-header">
          <div>
            <h2 id="loc-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={22} color="var(--primary)" /> Location & GPS Telemetry
            </h2>
            <p>Pinpoint your current location with high-precision GPS or search any landmark.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Current Active Location Card */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 700 }}>
              Active Coordinates
            </span>
            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
              {currentLoc.area || currentLoc.city}, {currentLoc.city}
            </strong>
            <small style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>
              {currentLoc.lat.toFixed(5)}° N, {currentLoc.lng.toFixed(5)}° E {currentLoc.isLiveGps ? '· 🛰️ Live GPS Active' : '· Manual'}
              {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ''}
            </small>
          </div>

          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: currentLoc.isLiveGps ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
              color: currentLoc.isLiveGps ? 'var(--sky)' : 'var(--text-muted)',
              border: `1px solid ${currentLoc.isLiveGps ? 'rgba(59, 130, 246, 0.3)' : 'var(--border)'}`,
            }}
          >
            {currentLoc.isLiveGps ? '🛰️ Real GPS' : 'Saved Preset'}
          </span>
        </div>

        {/* Big GPS Satellite Acquisition Button */}
        <button
          type="button"
          className="primary-btn"
          style={{
            width: '100%',
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '18px',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          }}
          onClick={handleAcquireGps}
          disabled={isAcquiringGps}
        >
          {isAcquiringGps ? (
            <>
              <Satellite size={17} className="animate-spin" /> Acquiring High-Precision GPS Fix...
            </>
          ) : (
            <>
              <Navigation size={17} /> Track My Current Real-Time Location (Live GPS)
            </>
          )}
        </button>

        {/* Address Search Bar */}
        <div style={{ marginBottom: '18px' }}>
          <label className="form-label">
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Or Search Any Street, Society, or Locality</span>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="e.g. Bandra West, Hinjewadi Phase 1, Indiranagar..."
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
              {isSearching && (
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Searching...
                </span>
              )}
            </div>
          </label>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                maxHeight: '190px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((res, i) => (
                <button
                  key={`${res.fullAddress}-${i}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '12.5px', display: 'block', color: 'var(--text-primary)' }}>
                      {res.area}, {res.city}
                    </strong>
                    <small style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', lineHeight: 1.3 }}>
                      {res.fullAddress}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Metro Presets */}
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Quick City Presets
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUPPORTED_CITIES.map((c) => {
              const isSelected = currentLoc.city.toLowerCase() === c.name.toLowerCase()
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectPresetCity(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {isSelected && <Check size={12} />}
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
