import { useState } from 'react'
import { Truck, X, ArrowRight, Calendar, Clock, MapPin, Phone } from 'lucide-react'
import type { StoredPickup } from '../types'
import { database } from '../database'

interface PickupModalProps {
  onClose: () => void
  onSubmit: (pickup: StoredPickup) => void
}

export function PickupModal({ onClose, onSubmit }: PickupModalProps) {
  const userLoc = database.getLocation()
  const [pickupType, setPickupType] = useState('Household waste')
  const [quantity, setQuantity] = useState('10–25 kg')
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState('08:00 – 10:00 AM')
  const [address, setAddress] = useState(() =>
    userLoc.city === 'Pune' ? 'Bluebell Heights, Viman Nagar, Pune' : `${userLoc.area || 'Ward Area'}, ${userLoc.city}`
  )
  const [contact, setContact] = useState('+91 98765 43210')
  const [instructions, setInstructions] = useState('')

  const timeSlots = [
    '08:00 – 10:00 AM',
    '10:00 AM – 12:00 PM',
    '02:00 – 04:00 PM',
    '04:00 – 06:00 PM',
  ]

  const quantities = [
    { label: '< 10 kg', desc: '1-2 standard bags' },
    { label: '10–25 kg', desc: '3-5 bags / carton' },
    { label: '25–50 kg', desc: 'Apartment bulk / large bins' },
    { label: '> 50 kg', desc: 'Society dumpster / truckload' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `PK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const newPickup: StoredPickup = {
      id,
      type: pickupType,
      address,
      contact,
      status: 'Requested',
      date,
      timeSlot,
      quantity,
      instructions,
      driverName: 'Pending assignment',
      createdAt: new Date().toISOString(),
    }

    onSubmit(newPickup)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="pickup-modal-title">
        <div className="modal-header">
          <div>
            <h2 id="pickup-modal-title">Book Doorstep Waste Pickup</h2>
            <p>Schedule a designated municipal collection vehicle for your home or society.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {/* Pickup Type */}
          <div className="form-label">
            <span>Collection Category</span>
            <select
              className="form-select"
              value={pickupType}
              onChange={(e) => setPickupType(e.target.value)}
              required
            >
              <option>Household waste</option>
              <option>Society / apartment waste</option>
              <option>Bulk furniture / mattress waste</option>
              <option>E-waste collection</option>
              <option>Garden & pruning green waste</option>
              <option>Construction & renovation debris</option>
            </select>
          </div>

          {/* Quantity Selector */}
          <div className="form-label">
            <span>Estimated Weight / Volume</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {quantities.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setQuantity(q.label)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${quantity === q.label ? 'var(--amber)' : 'var(--border)'}`,
                    backgroundColor: quantity === q.label ? 'var(--amber-light)' : 'var(--bg-subtle)',
                    color: quantity === q.label ? 'var(--amber)' : 'var(--text-primary)',
                    textAlign: 'left',
                    fontSize: '12px',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '13px' }}>{q.label}</strong>
                  <small style={{ color: 'var(--text-muted)' }}>{q.desc}</small>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Slot */}
          <div className="form-grid-2">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Preferred Date
              </span>
              <input
                type="date"
                className="form-input"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Time Window
              </span>
              <select
                className="form-select"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                required
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Address */}
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} /> Collection Address
            </span>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Flat No., Building Name, Street..."
              required
            />
          </label>

          {/* Contact Phone */}
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} /> Contact Phone
            </span>
            <input
              type="tel"
              className="form-input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+91 98765 43210"
              pattern="[0-9+() -]{7,}"
              required
            />
          </label>

          {/* Gate Instructions */}
          <label className="form-label">
            <span>Special Instructions / Gate Security Notes</span>
            <textarea
              className="form-textarea"
              placeholder="e.g. In basement parking near pillar B4, security guard has key..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
            />
          </label>

          <button
            type="submit"
            className="primary-btn"
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)',
              marginTop: '6px',
            }}
          >
            <Truck size={16} /> Confirm Collection Slot <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
