import { useState, useEffect } from 'react'
import {
  Upload,
  X,
  MapPin,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCw,
  ExternalLink,
} from 'lucide-react'
import type { WasteCategory, ReportPriority, StoredReport } from '../types'
import { database } from '../database'
import { reverseGeocode, getGoogleMapsUrl } from '../utils/geoUtils'

interface ReportModalProps {
  onClose: () => void
  onSubmit: (report: StoredReport) => void
  onToast: (msg: string) => void
}

const categories: { label: WasteCategory; icon: string; desc: string }[] = [
  { label: 'Mixed waste', icon: '🗑️', desc: 'Unsorted general refuse & household garbage' },
  { label: 'Plastic & packaging', icon: '🧴', desc: 'Bottles, bags, single-use containers' },
  { label: 'Organic waste', icon: '🍏', desc: 'Food leftovers, wet waste, market discards' },
  { label: 'Construction debris', icon: '🧱', desc: 'Rubble, tiles, cement, heavy building materials' },
  { label: 'Electronic / E-waste', icon: '🔌', desc: 'Cables, circuit boards, appliances' },
  { label: 'Hazardous waste', icon: '⚠️', desc: 'Chemicals, medical discards, batteries' },
]

export function ReportModal({ onClose, onSubmit, onToast }: ReportModalProps) {
  const userLoc = database.getLocation()
  const session = database.getSession()

  const [category, setCategory] = useState<WasteCategory>('Mixed waste')
  const [priority, setPriority] = useState<ReportPriority>('Medium')
  const [imagePreview, setImagePreview] = useState('')
  const [locationName, setLocationName] = useState(userLoc.area ? `${userLoc.area}, ${userLoc.city}` : 'FC Road, Pune')
  const [coordinates, setCoordinates] = useState({ lat: userLoc.lat, lng: userLoc.lng })
  const [description, setDescription] = useState('')
  const [isLocating, setIsLocating] = useState(() => typeof navigator !== 'undefined' && 'geolocation' in navigator)

  // Try auto-detecting current live location on open
  useEffect(() => {
    let active = true
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!active) return
          setIsLocating(false)
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoordinates({ lat, lng })
          const geo = await reverseGeocode(lat, lng)
          if (!active) return
          setLocationName(`${geo.area}, ${geo.city}`)
          database.setLocation({
            city: geo.city,
            area: geo.area,
            lat,
            lng,
            isLiveGps: true,
          })
          onToast(`Current location detected: ${geo.city} (${geo.area})`)
        },
        () => {
          if (active) setIsLocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
    return () => {
      active = false
    }
  }, [onToast])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onToast('Please choose an image file (JPG/PNG)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast('Image size must be under 10 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result ?? ''))
    }
    reader.readAsDataURL(file)
  }

  const handleDetectLocation = () => {
    setIsLocating(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocating(false)
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoordinates({ lat, lng })
          const geo = await reverseGeocode(lat, lng)
          setLocationName(`${geo.area}, ${geo.city}`)
          database.setLocation({
            city: geo.city,
            area: geo.area,
            lat,
            lng,
            isLiveGps: true,
          })
          onToast(`📍 Real-time GPS coordinates detected: ${geo.area}, ${geo.city}`)
        },
        (err) => {
          setIsLocating(false)
          onToast(`Could not acquire GPS: ${err.message}. You can manually type the address.`)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setIsLocating(false)
      onToast('Geolocation not available in browser')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `CW-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const iconCode = category.slice(0, 2).toUpperCase()

    const newReport: StoredReport = {
      id,
      type: category,
      category,
      location: locationName,
      addressDetails: description || 'Civic community report',
      lat: coordinates.lat,
      lng: coordinates.lng,
      status: 'Submitted',
      priority,
      time: 'Just now',
      icon: iconCode,
      description,
      image: imagePreview,
      reporterName: session?.name || 'Citizen User',
      reporterEmail: session?.email || '',
      createdAt: new Date().toISOString(),
      greenPointsAwarded: 50,
    }

    onSubmit(newReport)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div className="modal-header">
          <div>
            <h2 id="report-modal-title">Report Waste Incident</h2>
            <p>Help municipal collection teams locate, prioritize, and clear waste spots in your area.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {/* Green Points Incentive Pill */}
          <div className="points-reward-pill">
            <Sparkles size={16} />
            <span>Earn +50 Green Points upon verified community report clearance!</span>
          </div>

          {/* Photo Upload Zone */}
          <div className="form-label">
            <span>Incident Photo Proof</span>
            {imagePreview ? (
              <div className="photo-preview-wrap">
                <img src={imagePreview} alt="Waste preview" className="photo-preview-img" />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={() => setImagePreview('')}
                >
                  Change photo
                </button>
              </div>
            ) : (
              <label className="photo-upload-zone">
                <Upload size={28} color="var(--primary)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Click to upload or take a photo
                </strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  JPEG, PNG, WebP up to 10 MB
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* Waste Category Selection */}
          <div className="form-label">
            <span>Waste Category</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {categories.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${category === c.label ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: category === c.label ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: category === c.label ? 'var(--primary)' : 'var(--text-primary)',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    fontWeight: category === c.label ? 600 : 500,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{c.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity & Priority */}
          <div className="form-label">
            <span>Severity Level</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['Low', 'Medium', 'High', 'Critical'] as ReportPriority[]).map((level) => {
                const isSelected = priority === level
                let colorClass = 'var(--primary)'
                if (level === 'Medium') colorClass = 'var(--amber)'
                if (level === 'High') colorClass = 'var(--rose)'
                if (level === 'Critical') colorClass = '#991b1b'

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? colorClass : 'var(--border)'}`,
                      backgroundColor: isSelected ? `${colorClass}18` : 'var(--bg-subtle)',
                      color: isSelected ? colorClass : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    {level === 'Critical' && <AlertTriangle size={13} />}
                    {level}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <label className="form-label">
            <span>Additional details / landmarks</span>
            <textarea
              className="form-textarea"
              placeholder="e.g. Near the bus stop, blocking pedestrian pathway..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </label>

          {/* Location Detection with Google Maps link */}
          <div className="location-detection-box">
            <MapPin size={20} />
            <div className="location-detection-text">
              <strong>GPS: {coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E</strong>
              <small>{locationName}</small>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="detect-again-btn"
                onClick={handleDetectLocation}
                disabled={isLocating}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCw size={12} className={isLocating ? 'spin' : ''} />
                {isLocating ? 'Locating...' : 'Detect GPS'}
              </button>
              <a
                href={getGoogleMapsUrl(coordinates.lat, coordinates.lng)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11px', color: 'var(--sky)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                Google Maps <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Submit Action */}
          <button type="submit" className="primary-btn" style={{ marginTop: '8px' }}>
            Submit Civic Report <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
