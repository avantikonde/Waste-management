import {
  Truck,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ArrowUpRight,
} from 'lucide-react'
import type { StoredPickup } from '../types'
import { database } from '../database'

interface PickupRequestsViewProps {
  pickups: StoredPickup[]
  onOpenPickupModal: () => void
  onNavigate: (route: string) => void
  onToast: (msg: string) => void
}

export function PickupRequestsView({
  pickups,
  onOpenPickupModal,
  onNavigate,
  onToast,
}: PickupRequestsViewProps) {
  const activePickup = pickups[0]
  const loc = database.getLocation()

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Municipal Fleet Logistics</span>
            <span className="live-indicator">Doorstep Collection</span>
          </div>
          <h1>Pickup Requests</h1>
          <p className="page-subtitle">
            Schedule bulk, recyclable, or household waste collections directly to your doorstep.
          </p>
        </div>

        <button className="primary-btn" style={{ width: 'auto' }} onClick={onOpenPickupModal}>
          <Plus size={16} /> Schedule New Pickup
        </button>
      </div>

      {/* Mini Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon amber">
            <Truck size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Upcoming Pickups</span>
            <strong className="stat-value">{String(pickups.length).padStart(2, '0')}</strong>
            <span className="stat-trend warning">Next: Today 10:42 AM</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Completed Collections</span>
            <strong className="stat-value">14</strong>
            <span className="stat-trend">100% on-time fulfillment</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Clock size={20} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Average Response</span>
            <strong className="stat-value">18 min</strong>
            <span className="stat-trend">Fleet speed rating: Optimal</span>
          </div>
        </div>
      </div>

      {/* Active Pickup Details & Timeline */}
      {activePickup ? (
        <div className="layout-split">
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>In Progress Dispatch</p>
                <h2>Booking {activePickup.id}</h2>
              </div>
              <span className="status-pill in-progress">{activePickup.status}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                padding: '16px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                  Waste Category
                </span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {activePickup.type}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                  Estimated Quantity
                </span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {activePickup.quantity || '25–50 kg'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                  Scheduled Window
                </span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {activePickup.date} ({activePickup.timeSlot})
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                  Collection Vehicle
                </span>
                <strong style={{ fontSize: '13.5px', color: 'var(--primary)' }}>
                  {activePickup.vehicleNumber || 'MH 12 AB 2840'} (ETA 12 min)
                </strong>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                  Pickup Address
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--primary)" /> {activePickup.address}
                </strong>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePickup.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: 'var(--sky)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', textDecoration: 'underline' }}
                >
                  View on Google Maps <ArrowUpRight size={11} />
                </a>
              </div>

              {activePickup.instructions && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                    Access Notes
                  </span>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    "{activePickup.instructions}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="outline-btn"
                style={{ flex: 1 }}
                onClick={() => onToast('Contacting driver Ravi K. (+91 98765 43210)...')}
              >
                <Phone size={14} /> Call Driver
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ flex: 1.3 }}
                onClick={() => onNavigate('Nearby waste')}
              >
                Track Live Location <ArrowUpRight size={15} />
              </button>
            </div>
          </section>

          {/* Stepper Timeline */}
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>Tracking Log</p>
                <h2>Dispatch Progress</h2>
              </div>
            </div>

            <div className="timeline-stepper">
              <div className="timeline-step completed">
                <div className="step-marker">
                  <CheckCircle2 size={12} />
                </div>
                <div className="step-content">
                  <strong>Request Accepted & Logged</strong>
                  <small>09:48 AM · Booking confirmed by central depot</small>
                </div>
              </div>

              <div className="timeline-step completed">
                <div className="step-marker">
                  <CheckCircle2 size={12} />
                </div>
                <div className="step-content">
                  <strong>Collection Vehicle Assigned</strong>
                  <small>09:51 AM · Driver Ravi K. allocated</small>
                </div>
              </div>

              <div className="timeline-step active">
                <div className="step-marker">3</div>
                <div className="step-content">
                  <strong>Vehicle En Route</strong>
                  <small>10:02 AM · In transit towards {loc.area || loc.city || 'your area'}</small>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-marker">4</div>
                <div className="step-content">
                  <strong>Doorstep Weighing & Collection</strong>
                  <small>Pending arrival · Estimated 10:20 AM</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Truck size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No Active Doorstep Pickups</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '16px' }}>
            Book a vehicle when you have segregated society waste, bulk discards, or e-waste.
          </p>
          <button className="primary-btn" style={{ width: 'auto', margin: '0 auto' }} onClick={onOpenPickupModal}>
            Book a Pickup Now
          </button>
        </div>
      )}

      {/* Historical Pickups */}
      {pickups.length > 0 && (
        <section className="panel" style={{ marginTop: '24px' }}>
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Booking Archive</p>
              <h2>Saved Pickup History</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pickups.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                    {p.id} · {p.type}
                  </strong>
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {p.address} · {p.date} ({p.timeSlot})
                  </small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`status-pill ${p.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {p.status}
                  </span>
                  <button
                    className="outline-btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => onToast(`Booking confirmation for ${p.id} sent to SMS`)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
