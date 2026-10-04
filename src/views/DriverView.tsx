import { useState } from 'react'
import {
  Truck,
  MapPin,
  CheckCircle2,
  Navigation,
  Clock,
  BatteryCharging,
  Upload,
  AlertCircle,
  Phone,
} from 'lucide-react'
import type { DriverAssignment } from '../types'
import { database } from '../database'
import { getGoogleMapsDirectionsUrl } from '../utils/geoUtils'

interface DriverViewProps {
  onToast: (msg: string) => void
}

export function DriverView({ onToast }: DriverViewProps) {
  const [assignments, setAssignments] = useState<DriverAssignment[]>(() =>
    database.getDriverAssignments()
  )
  const [vehicleCapacity, setVehicleCapacity] = useState(78)

  const handleStatusChange = (id: string, status: DriverAssignment['status']) => {
    const next = database.updateDriverAssignment(id, status)
    setAssignments(next)

    if (status === 'Collected') {
      setVehicleCapacity((prev) => Math.min(100, prev + 8))
      onToast(`Stop ${id} collected! Capacity updated to ${Math.min(100, vehicleCapacity + 8)}%`)
    } else {
      onToast(`Stop ${id} status updated to ${status}`)
    }
  }

  return (
    <div className="page-content">
      {/* Driver Workspace Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Crew Telemetry: MH 12 AB 2840</span>
            <span className="live-indicator">On Duty · Shift #2</span>
          </div>
          <h1>Driver & Collection Crew Command</h1>
          <p className="page-subtitle">
            Welcome back, Driver Ravi. Your next optimized stop is <strong>1.4 km away</strong>.
          </p>
        </div>

        <a
          href={getGoogleMapsDirectionsUrl(assignments[0]?.lat || 18.5186, assignments[0]?.lng || 73.8415)}
          target="_blank"
          rel="noreferrer"
          className="primary-btn"
          style={{ width: 'auto' }}
        >
          <Navigation size={16} /> Open in Google Maps
        </a>
      </div>

      {/* Vehicle Telemetry & Capacity Banner */}
      <div
        className="panel"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
              Vehicle Load Meter
            </span>
            <strong style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
              {vehicleCapacity}% of 2.5 Tonne Capacity
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <BatteryCharging size={18} color="var(--primary)" />
              <span>EV Battery: <strong>84%</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Truck size={18} color="var(--sky)" />
              <span>Depot: <strong>East Sector Yard</strong></span>
            </div>
          </div>
        </div>

        <div className="impact-bar-wrap" style={{ height: '10px', marginTop: '14px' }}>
          <div
            className="impact-bar-fill"
            style={{
              width: `${vehicleCapacity}%`,
              backgroundColor: vehicleCapacity > 90 ? 'var(--rose)' : vehicleCapacity > 75 ? 'var(--amber)' : 'var(--primary)',
            }}
          />
        </div>
      </div>

      {/* Driver Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Stops Remaining</span>
            <strong className="stat-value">
              {assignments.filter((a) => a.status !== 'Collected').length}
            </strong>
            <span className="stat-trend warning">Next at 10:45 AM</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Collected Today</span>
            <strong className="stat-value">12 Stops</strong>
            <span className="stat-trend">+20% efficiency</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Truck size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Route Covered</span>
            <strong className="stat-value">24.6 km</strong>
            <span className="stat-trend">Avg speed 28 km/h</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <AlertCircle size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">SLA Compliance</span>
            <strong className="stat-value">98.4%</strong>
            <span className="stat-trend">Rank #1 in Zone 4</span>
          </div>
        </div>
      </div>

      {/* Route Stop Sequence */}
      <section className="panel">
        <div className="panel-header">
          <div className="panel-title-wrap">
            <p>Assigned Route</p>
            <h2>Sequential Collection Stops</h2>
          </div>
          <button
            className="outline-btn"
            onClick={() => {
              setAssignments(database.getDriverAssignments())
              onToast('Driver assignments synced with municipal dispatch')
            }}
          >
            Sync Route
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {assignments.map((item, idx) => {
            const isCompleted = item.status === 'Collected'
            return (
              <div
                key={item.id}
                className="driver-stop-card"
                style={{
                  opacity: isCompleted ? 0.7 : 1,
                  backgroundColor: isCompleted ? 'var(--bg-subtle)' : undefined,
                }}
              >
                <div className="stop-sequence-num">
                  {isCompleted ? <CheckCircle2 size={16} color="var(--primary)" /> : idx + 1}
                </div>

                {item.reportImage && (
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                    <img src={item.reportImage} alt="Spot preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div className="driver-stop-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{item.type}</strong>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: item.priority === 'High' ? 'var(--rose-light)' : 'var(--amber-light)',
                        color: item.priority === 'High' ? 'var(--rose)' : 'var(--amber)',
                        fontWeight: 700,
                      }}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p>
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                    {item.location} · {item.distanceKm} km away
                  </p>
                </div>

                <div className="driver-action-group">
                  <a
                    href={getGoogleMapsDirectionsUrl(item.lat, item.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="outline-btn"
                    style={{ padding: '8px 12px', fontSize: '12px', textDecoration: 'none' }}
                    title="Open turn-by-turn directions in Google Maps"
                  >
                    <Navigation size={13} /> GPS
                  </a>

                  {item.status === 'New' && (
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '8px 16px', fontSize: '12.5px', width: 'auto' }}
                      onClick={() => handleStatusChange(item.id, 'Accepted')}
                    >
                      Accept Job
                    </button>
                  )}

                  {item.status === 'Accepted' && (
                    <>
                      <button
                        type="button"
                        className="outline-btn"
                        style={{ padding: '8px 14px', fontSize: '12.5px' }}
                        onClick={() => onToast(`Calling citizen contact for ${item.location}...`)}
                      >
                        <Phone size={14} /> Call
                      </button>
                      <button
                        type="button"
                        className="primary-btn"
                        style={{ padding: '8px 16px', fontSize: '12.5px', width: 'auto' }}
                        onClick={() => handleStatusChange(item.id, 'Arrived')}
                      >
                        Mark Arrived
                      </button>
                    </>
                  )}

                  {item.status === 'Arrived' && (
                    <button
                      type="button"
                      className="primary-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        width: 'auto',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      }}
                      onClick={() => handleStatusChange(item.id, 'Collected')}
                    >
                      <Upload size={14} /> Complete & Clear
                    </button>
                  )}

                  {item.status === 'Collected' && (
                    <span className="status-pill resolved">Collected</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

