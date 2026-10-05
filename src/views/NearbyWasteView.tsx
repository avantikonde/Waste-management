import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Truck,
  MapPin,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Navigation,
} from 'lucide-react'
import type { StoredReport, UserLocationState } from '../types'
import { database } from '../database'
import {
  SUPPORTED_CITIES,
  getGoogleMapsUrl,
  getGoogleMapsDirectionsUrl,
  reverseGeocode,
  getHighAccuracyPosition,
} from '../utils/geoUtils'
import { formatRelativeTime } from '../utils/dateUtils'

interface NearbyWasteViewProps {
  reports: StoredReport[]
  onSelectReport: (report: StoredReport) => void
  onToast: (msg: string) => void
}

export function NearbyWasteView({
  reports,
  onSelectReport,
  onToast,
}: NearbyWasteViewProps) {
  const [filter, setFilter] = useState('All')
  const [isLiveTracking, setIsLiveTracking] = useState(true)
  const [userLoc, setUserLoc] = useState<UserLocationState>(() => database.getLocation())
  const [isLocating, setIsLocating] = useState(false)

  // Sync with database updates
  useEffect(() => {
    return database.subscribeToDatabase(() => {
      setUserLoc(database.getLocation())
    })
  }, [])

  const userCenter: [number, number] = [userLoc.lat, userLoc.lng]

  // Collection truck position in the same city as user
  const vehiclePos: [number, number] = isLiveTracking
    ? [userLoc.lat + 0.0055, userLoc.lng + 0.0068]
    : [userLoc.lat - 0.004, userLoc.lng - 0.005]

  const truckIcon = L.divIcon({
    className: 'custom-map-pin truck-pin',
    html: '<span style="font-size: 16px; line-height: 1;">🚛</span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

  // Detect user's live GPS
  const handleDetectLiveGps = async () => {
    setIsLocating(true)
    try {
      const fix = await getHighAccuracyPosition()
      const geo = await reverseGeocode(fix.lat, fix.lng)
      const nextLoc: UserLocationState = {
        city: geo.city,
        area: geo.area,
        lat: fix.lat,
        lng: fix.lng,
        isLiveGps: true,
      }
      database.setLocation(nextLoc)
      setUserLoc(nextLoc)
      onToast(`📍 Live GPS located: ${geo.area}, ${geo.city} (±${Math.round(fix.accuracy)}m)`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      onToast(`Could not access live GPS: ${message}`)
    } finally {
      setIsLocating(false)
    }
  }

  // Switch City
  const handleCitySelect = (cityId: string) => {
    const preset = SUPPORTED_CITIES.find((c) => c.id === cityId)
    if (!preset) return
    const nextLoc: UserLocationState = {
      city: preset.name,
      area: preset.neighborhoods[0],
      lat: preset.lat,
      lng: preset.lng,
      isLiveGps: false,
    }
    database.setLocation(nextLoc)
    setUserLoc(nextLoc)
    onToast(`Switched map center to ${preset.name}`)
  }

  const filteredReports = reports.filter((r) => {
    if (filter === 'All') return true
    if (filter === 'High Priority') return r.priority === 'High' || r.priority === 'Critical'
    return r.category === filter
  })

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Geographic Information System (GIS)</span>
            <span className="live-indicator">{userLoc.city} Active</span>
          </div>
          <h1>Local Neighborhood Waste Grid</h1>
          <p className="page-subtitle">
            Explore reported waste clusters, active collection trucks, and community-cleared spots in <strong>{userLoc.city}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="outline-btn"
            disabled={isLocating}
            onClick={handleDetectLiveGps}
            style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
          >
            <Navigation size={14} className={isLocating ? 'spin' : ''} />
            {isLocating ? 'Locating...' : 'Detect My Live GPS'}
          </button>

          <a
            href={getGoogleMapsUrl(userLoc.lat, userLoc.lng)}
            target="_blank"
            rel="noreferrer"
            className="header-action-btn"
          >
            <ExternalLink size={15} /> Open in Google Maps
          </a>
        </div>
      </div>

      {/* City Switcher & Category Filter Toolbar */}
      <div className="map-toolbar" style={{ gap: '12px' }}>
        {/* City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="var(--primary)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>City:</span>
          <select
            className="select-filter"
            style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600 }}
            value={
              SUPPORTED_CITIES.find(
                (c) => c.name.toLowerCase() === userLoc.city.toLowerCase() || userLoc.city.toLowerCase().includes(c.id)
              )?.id || (userLoc.isLiveGps ? 'live' : 'custom')
            }
            onChange={(e) => {
              if (e.target.value === 'live') {
                handleDetectLiveGps()
              } else if (e.target.value !== 'custom') {
                handleCitySelect(e.target.value)
              }
            }}
          >
            {userLoc.isLiveGps && (
              <option value="live">📍 {userLoc.area || userLoc.city} (Live GPS)</option>
            )}
            {!userLoc.isLiveGps && !SUPPORTED_CITIES.some((c) => c.name.toLowerCase() === userLoc.city.toLowerCase()) && (
              <option value="custom">📍 {userLoc.area || userLoc.city} (Current)</option>
            )}
            {SUPPORTED_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filters */}
        <div className="filter-pill-group">
          {['All', 'High Priority', 'Plastic & packaging', 'Mixed waste', 'Organic waste', 'Construction debris'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Split Grid: Map Canvas & Marker Side List */}
      <div className="layout-split">
        {/* Real Leaflet Map */}
        <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="map-container-box" style={{ height: '500px', border: 'none' }}>
            <MapContainer
              key={`${userLoc.lat}-${userLoc.lng}`}
              center={userCenter}
              zoom={14}
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Center Location Pin - Blue Pulsing Beacon */}
              <CircleMarker
                center={userCenter}
                radius={10}
                pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 3 }}
              >
                <Popup>
                  <div className="popup-card">
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                      You Are Here {userLoc.isLiveGps ? '(Live GPS)' : ''}
                    </strong>
                    <p style={{ margin: '4px 0', fontSize: '12px' }}>{userLoc.area ? `${userLoc.area}, ${userLoc.city}` : userLoc.city}</p>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      {userLoc.lat.toFixed(5)}° N, {userLoc.lng.toFixed(5)}° E
                    </small>
                    <a
                      href={getGoogleMapsUrl(userLoc.lat, userLoc.lng)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: 'var(--sky)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      Open in Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
                </Popup>
              </CircleMarker>

              {/* Live Collection Truck Marker */}
              <Marker position={vehiclePos} icon={truckIcon}>
                <Popup>
                  <div className="popup-card">
                    <strong>Collection Truck MH 12 AB 2840</strong>
                    <p>Driver Ravi K. · {isLiveTracking ? 'In transit (12 min away)' : 'Parked'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span className="status-pill in-progress">En Route</span>
                      <a
                        href={getGoogleMapsDirectionsUrl(vehiclePos[0], vehiclePos[1])}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: 'var(--sky)', textDecoration: 'underline' }}
                      >
                        Navigate
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Route Polyline connecting user to vehicle */}
              <Polyline
                positions={[userCenter, vehiclePos]}
                pathOptions={{ color: '#0284c7', dashArray: '6 8', weight: 3 }}
              />

              {/* Filtered Report Markers */}
              {filteredReports.map((report) => {
                const isResolved = report.status === 'Resolved'
                const isCritical = report.priority === 'Critical'
                const isHigh = report.priority === 'High'

                let pinColor = '#d97706'
                if (isResolved) pinColor = '#10b981'
                else if (isCritical || isHigh) pinColor = '#e11d48'

                const reportLat = report.lat || userLoc.lat
                const reportLng = report.lng || userLoc.lng

                return (
                  <CircleMarker
                    key={report.id}
                    center={[reportLat, reportLng]}
                    radius={8}
                    pathOptions={{ color: pinColor, fillColor: pinColor, fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <div className="popup-card">
                        <strong>{report.type}</strong>
                        <p>{report.location}</p>
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                          Reported: {formatRelativeTime(report.createdAt)}
                        </small>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span className={`status-pill ${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {report.status}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a
                              href={getGoogleMapsUrl(reportLat, reportLng)}
                              target="_blank"
                              rel="noreferrer"
                              className="outline-btn"
                              style={{ padding: '3px 7px', fontSize: '10.5px' }}
                              title="Open spot in Google Maps"
                            >
                              Maps ↗
                            </a>
                            <button
                              type="button"
                              className="outline-btn"
                              style={{ padding: '3px 7px', fontSize: '10.5px' }}
                              onClick={() => onSelectReport(report)}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>

          {/* Map Footer Bar */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--sky)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isLiveTracking
                  ? `Truck MH 12 AB 2840 broadcasting live telemetry in ${userLoc.city}`
                  : 'Vehicle tracking paused'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={getGoogleMapsDirectionsUrl(vehiclePos[0], vehiclePos[1])}
                target="_blank"
                rel="noreferrer"
                className="outline-btn"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Track on Google Maps <ExternalLink size={11} />
              </a>
              <button
                type="button"
                className="outline-btn"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  setIsLiveTracking((v) => !v)
                  onToast(isLiveTracking ? 'Truck telemetry paused' : 'Live telemetry resumed')
                }}
              >
                {isLiveTracking ? 'Pause Telemetry' : 'Resume Telemetry'}
              </button>
            </div>
          </div>
        </div>

        {/* Nearby Markers Sidebar */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>{userLoc.city} Queue</p>
              <h2>{filteredReports.length} Reports Found</h2>
            </div>
            <Sparkles size={18} color="var(--primary)" />
          </div>

          <div className="report-list" style={{ flex: 1, overflowY: 'auto', maxHeight: '470px' }}>
            {filteredReports.map((report) => (
              <button
                key={report.id}
                className="report-item-card"
                onClick={() => onSelectReport(report)}
              >
                <div className={`report-category-icon ${report.priority.toLowerCase()}`}>
                  {report.icon}
                </div>
                <div className="report-main-info">
                  <div className="report-title-row">
                    <strong>{report.type}</strong>
                  </div>
                  <div className="report-location-sub">
                    <MapPin size={12} /> {report.location}
                  </div>
                </div>
                <span className={`status-pill ${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {report.status}
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
