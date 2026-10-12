import { useState } from 'react'
import { Truck, X, ArrowRight, Calendar, Clock, MapPin, Phone, Navigation } from 'lucide-react'
import type { StoredPickup } from '../types'
import { database } from '../database'
import { getHighAccuracyPosition, reverseGeocode } from '../utils/geoUtils'

interface PickupModalProps {
  onClose: () => void
  onSubmit: (pickup: StoredPickup) => void
}

function generatePickupId(): string {
  return `PK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
}

export function PickupModal({ onClose, onSubmit }: PickupModalProps) {
  const userLoc = database.getLocation()
  const [pickupType, setPickupType] = useState('Household waste')
  const [quantity, setQuantity] = useState('10–25 kg')
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState('08:00 – 10:00 AM')
  const [address, setAddress] = useState(() =>
    userLoc.area ? `${userLoc.area}, ${userLoc.city}` : userLoc.city || ''
  )
  const [coordinates, setCoordinates] = useState({ lat: userLoc.lat, lng: userLoc.lng })
  const [isLocating, setIsLocating] = useState(false)
  const [contact, setContact] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

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

  const availableSlots = database.getAvailableDriversForSlot(
    date,
    timeSlot,
    coordinates.lat,
    coordinates.lng,
    address
  )

  const handleDetectLiveLocation = async () => {
    setIsLocating(true)
    try {
      const fix = await getHighAccuracyPosition()
      setCoordinates({ lat: fix.lat, lng: fix.lng })
      const geo = await reverseGeocode(fix.lat, fix.lng)
      setAddress(`${geo.area}, ${geo.city}`)
      database.setLocation({
        city: geo.city,
        area: geo.area,
        lat: fix.lat,
        lng: fix.lng,
        isLiveGps: true,
      })
    } catch {
      // Keep existing address
    } finally {
      setIsLocating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = generatePickupId()
    const activeSlotId = selectedSlotId || (availableSlots.length > 0 ? availableSlots[0].id : undefined)

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
      lat: coordinates.lat,
      lng: coordinates.lng,
      availabilitySlotId: activeSlotId,
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

          {/* Driver Selection & Shift Availability */}
          <div className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} color="var(--primary)" /> Available Driver for this Shift & Ward
              </span>
              <span style={{ fontSize: '11px', color: availableSlots.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                {availableSlots.length > 0 ? `🟢 ${availableSlots.length} Driver(s) Declared Free` : 'Auto-dispatch mode'}
              </span>
            </span>

            {availableSlots.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {availableSlots.map((slot) => {
                  const isSelected = (selectedSlotId || availableSlots[0].id) === slot.id
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {slot.driverName}
                          </strong>
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            {slot.vehicleNumber} ({slot.vehicleType})
                          </span>
                        </div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block', marginTop: '2px' }}>
                          Operating Area: {slot.location} · Shift: {slot.timeSlot}
                        </small>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`tel:${slot.driverPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="outline-btn"
                          style={{ padding: '4px 8px', fontSize: '11.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Call driver directly"
                        >
                          <Phone size={12} color="var(--primary)" /> {slot.driverPhone}
                        </a>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px dashed var(--border)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                }}
              >
                No specific driver pre-declared free hours for this slot. Central municipal dispatch will automatically route the nearest on-duty crew upon booking.
              </div>
            )}
          </div>

          {/* Address with Live GPS Button */}
          <label className="form-label">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> Collection Address & Coordinates
              </span>
              <button
                type="button"
                className="outline-btn"
                style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={handleDetectLiveLocation}
                disabled={isLocating}
                title="Detect live GPS coordinates at this location"
              >
                <Navigation size={11} /> {isLocating ? 'Locating...' : 'Use Live GPS'}
              </button>
            </div>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Flat No., Building Name, Street..."
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              GPS: {coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E (Auto-assigns nearest municipal crew)
            </small>
          </label>

          {/* Citizen Contact Phone */}
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} /> Your Contact Phone Number
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
            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              The assigned municipal driver will call this number when arriving at your gate.
            </small>
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
