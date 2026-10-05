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
  Edit3,
  X,
  Check,
  UserCheck,
} from 'lucide-react'
import type { DriverAssignment, DriverProfile } from '../types'
import { database } from '../database'
import { getGoogleMapsDirectionsUrl } from '../utils/geoUtils'

interface DriverViewProps {
  onToast: (msg: string) => void
}

export function DriverView({ onToast }: DriverViewProps) {
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() =>
    database.getDriverProfile()
  )
  const [assignments, setAssignments] = useState<DriverAssignment[]>(() =>
    database.getDriverAssignments()
  )
  const [vehicleCapacity, setVehicleCapacity] = useState(78)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(driverProfile.name)
  const [editPhone, setEditPhone] = useState(driverProfile.phone)
  const [editVehicle, setEditVehicle] = useState(driverProfile.vehicleNumber)
  const [editVehicleType, setEditVehicleType] = useState(driverProfile.vehicleType)
  const [editZone, setEditZone] = useState(driverProfile.zone)
  const [editDepot, setEditDepot] = useState(driverProfile.depot)
  const [editStatus, setEditStatus] = useState(driverProfile.status)

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const updated = database.updateDriverProfile({
      name: editName.trim() || driverProfile.name,
      phone: editPhone.trim() || driverProfile.phone,
      vehicleNumber: editVehicle.trim() || driverProfile.vehicleNumber,
      vehicleType: editVehicleType,
      zone: editZone.trim() || driverProfile.zone,
      depot: editDepot.trim() || driverProfile.depot,
      status: editStatus,
    })

    setDriverProfile(updated)
    setAssignments(database.getDriverAssignments())
    setIsEditingProfile(false)
    onToast(`✅ Driver profile saved! Your variable phone number (${updated.phone}) is now live on all assigned citizen dispatches.`)
  }

  return (
    <div className="page-content">
      {/* Driver Workspace Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Crew Telemetry: {driverProfile.vehicleNumber} · Phone: {driverProfile.phone}</span>
            <span className="live-indicator">{driverProfile.status} · Shift #2</span>
          </div>
          <h1>Driver & Collection Crew Command</h1>
          <p className="page-subtitle">
            Welcome back, Driver {driverProfile.name}. Your next optimized stop is <strong>1.4 km away</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="outline-btn"
            style={{ width: 'auto' }}
            onClick={() => {
              setEditName(driverProfile.name)
              setEditPhone(driverProfile.phone)
              setEditVehicle(driverProfile.vehicleNumber)
              setEditVehicleType(driverProfile.vehicleType)
              setEditZone(driverProfile.zone)
              setEditDepot(driverProfile.depot)
              setEditStatus(driverProfile.status)
              setIsEditingProfile(true)
            }}
          >
            <Edit3 size={15} /> Edit Contact & Vehicle
          </button>

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
      </div>

      {/* Driver Profile & Variable Contact Card */}
      <div
        className="panel"
        style={{
          marginBottom: '24px',
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="var(--primary)" />
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                Active Driver Profile: {driverProfile.name}
              </strong>
              <span className="status-pill resolved" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {driverProfile.status}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Assigned Vehicle: <strong>{driverProfile.vehicleNumber}</strong> ({driverProfile.vehicleType}) · Depot: <strong>{driverProfile.depot}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              <Phone size={14} />
              <span>Direct Phone: <a href={`tel:${driverProfile.phone}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{driverProfile.phone}</a></span>
            </div>

            <button
              type="button"
              className="outline-btn"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => {
                setEditName(driverProfile.name)
                setEditPhone(driverProfile.phone)
                setEditVehicle(driverProfile.vehicleNumber)
                setEditVehicleType(driverProfile.vehicleType)
                setEditZone(driverProfile.zone)
                setEditDepot(driverProfile.depot)
                setEditStatus(driverProfile.status)
                setIsEditingProfile(true)
              }}
            >
              <Edit3 size={13} /> Change Phone Number
            </button>
          </div>
        </div>
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
              Vehicle Load Meter ({driverProfile.vehicleNumber})
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
              <span>Depot: <strong>{driverProfile.depot}</strong></span>
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
                  {item.citizenPhone && (
                    <small style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block', marginTop: '2px' }}>
                      Citizen Contact: <a href={`tel:${item.citizenPhone}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{item.citizenPhone}</a>
                    </small>
                  )}
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
                      <a
                        href={`tel:${item.citizenPhone || '+91 98220 12345'}`}
                        className="outline-btn"
                        style={{ padding: '8px 14px', fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onToast(`Calling citizen for ${item.location} (${item.citizenPhone || 'contact'})...`)}
                      >
                        <Phone size={14} /> Call Citizen
                      </a>
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

      {/* Driver Profile & Variable Contact Edit Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsEditingProfile(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} role="dialog" aria-modal="true" aria-labelledby="driver-profile-title">
            <div className="modal-header">
              <div>
                <h2 id="driver-profile-title">Driver Profile & Variable Contact</h2>
                <p>Update your active mobile number and vehicle telemetry. This phone number will be displayed on citizen tickets so they can call you.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEditingProfile(false)} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="form-stack">
              <label className="form-label">
                <span>Driver Full Name</span>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  required
                />
              </label>

              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="var(--primary)" /> Driver Mobile Phone Number (Variable)
                </span>
                <input
                  type="tel"
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  pattern="[0-9+() -]{7,}"
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Put your active mobile number here. Citizens will see and call this number when you are dispatched.
                </small>
              </label>

              <div className="form-grid-2">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} /> Vehicle Registration No.
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    value={editVehicle}
                    onChange={(e) => setEditVehicle(e.target.value)}
                    placeholder="e.g. MH 12 AB 2840"
                    required
                  />
                </label>

                <label className="form-label">
                  <span>Vehicle Type</span>
                  <select
                    className="form-select"
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                  >
                    <option>Electric Tipper Truck (2.5T)</option>
                    <option>Heavy Compactor Truck (6T)</option>
                    <option>E-Cart Segregated Bin (500kg)</option>
                    <option>Hazardous / Medical Waste Van</option>
                  </select>
                </label>
              </div>

              <div className="form-grid-2">
                <label className="form-label">
                  <span>Duty Zone / Ward</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    placeholder="e.g. Central Ward & Swargate"
                    required
                  />
                </label>

                <label className="form-label">
                  <span>Assigned Depot</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editDepot}
                    onChange={(e) => setEditDepot(e.target.value)}
                    placeholder="e.g. East Sector Yard"
                    required
                  />
                </label>
              </div>

              <label className="form-label">
                <span>Duty Shift Status</span>
                <select
                  className="form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DriverProfile['status'])}
                >
                  <option value="On Duty">On Duty (Available for immediate live dispatch)</option>
                  <option value="Available">Available (On standby)</option>
                  <option value="Off Duty">Off Duty (Shift completed)</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ flex: 1.5 }}
                >
                  <Check size={16} /> Save Driver Profile & Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
