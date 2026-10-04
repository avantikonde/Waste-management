import {
  X,
  MapPin,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  Phone,
} from 'lucide-react'
import type { StoredReport } from '../types'
import { getGoogleMapsUrl } from '../utils/geoUtils'
import { formatRelativeTime } from '../utils/dateUtils'

interface ReportDetailsModalProps {
  report: StoredReport | null
  onClose: () => void
  onToast: (msg: string) => void
}

export function ReportDetailsModal({ report, onClose, onToast }: ReportDetailsModalProps) {
  if (!report) return null

  const steps = [
    { title: 'Report Submitted', time: formatRelativeTime(report.createdAt) || report.time, desc: 'Logged and geo-tagged in civic registry', status: 'done' },
    {
      title: 'Ward Verification',
      time: report.status !== 'Submitted' ? '30 mins later' : 'Pending inspection',
      desc: 'Ward supervisor confirmed location coordinates',
      status: report.status !== 'Submitted' ? 'done' : 'active',
    },
    {
      title: 'Crew Assigned',
      time: report.assignedDriver ? 'Assigned' : 'In dispatch queue',
      desc: report.assignedDriver ? `${report.assignedDriver} (${report.vehicleNumber || 'MH 12 AB 2840'})` : 'Auto-allocating nearest available vehicle',
      status: report.status === 'Assigned' || report.status === 'Team on way' || report.status === 'In progress' || report.status === 'Resolved' ? 'done' : 'pending',
    },
    {
      title: 'Collection & Site Clearance',
      time: report.status === 'Resolved' ? 'Completed' : report.estimatedClearance || 'Estimated today',
      desc: report.status === 'Resolved' ? 'Waste weighed, segregated and safely diverted' : 'In transit / active collection',
      status: report.status === 'Resolved' ? 'done' : report.status === 'Team on way' || report.status === 'In progress' ? 'active' : 'pending',
    },
  ]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card report-details-drawer" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`status-pill ${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {report.status}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: report.priority === 'Critical' ? '#fef2f2' : report.priority === 'High' ? 'var(--rose-light)' : 'var(--bg-subtle)',
                  color: report.priority === 'Critical' ? '#991b1b' : report.priority === 'High' ? 'var(--rose)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {report.priority === 'Critical' && <AlertTriangle size={11} />}
                {report.priority} Priority
              </span>
            </div>
            <h2>{report.id}</h2>
            <p>{report.type}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="form-stack">
          {/* Photo proof if available */}
          {report.image && (
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img
                src={report.image}
                alt="Reported waste spot"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Location & Details Banner */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                  {report.location}
                </strong>
                {report.lat && report.lng && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      GPS: {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E
                    </small>
                    <a
                      href={getGoogleMapsUrl(report.lat, report.lng)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: 'var(--sky)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      Open in Google Maps <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                {report.reporterName && (
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    Reported by: <strong>{report.reporterName}</strong>
                  </small>
                )}
              </div>
            </div>

            {report.description && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                "{report.description}"
              </p>
            )}
          </div>

          {/* Points Awarded */}
          <div className="points-reward-pill">
            <Award size={16} />
            <span>+{report.greenPointsAwarded || 50} Green Points credited for this civic contribution</span>
          </div>

          {/* Lifecycle Progress Stepper */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Clearance Progression
            </span>
            <div className="timeline-stepper">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`timeline-step ${s.status === 'done' ? 'completed' : s.status === 'active' ? 'active' : ''}`}
                >
                  <div className="step-marker">
                    {s.status === 'done' ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>
                  <div className="step-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong>{s.title}</strong>
                      <small>{s.time}</small>
                    </div>
                    <small>{s.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Crew Card */}
          {report.assignedDriver && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--sky-light)',
                  color: 'var(--sky)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Truck size={19} />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {report.assignedDriver}
                  </strong>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--primary)',
                    }}
                  >
                    On Duty
                  </span>
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block' }}>
                  Truck: <strong>{report.vehicleNumber || 'MH 12 AB 2840'}</strong>
                </small>
                <small style={{ color: 'var(--text-secondary)', fontSize: '11.5px', display: 'block' }}>
                  Driver Phone: <strong>{report.driverPhone || '+91 98220 44123'}</strong>
                </small>
              </div>
              <a
                href={`tel:${(report.driverPhone || '+919822044123').replace(/\s+/g, '')}`}
                className="primary-btn"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                onClick={() => onToast(`Calling Driver ${report.assignedDriver}...`)}
              >
                <Phone size={13} /> Call Driver
              </a>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="outline-btn"
              style={{ flex: 1 }}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
                onToast('Tracking link copied to clipboard!')
              }}
            >
              <ExternalLink size={14} /> Share Report
            </button>
            <button
              type="button"
              className="primary-btn"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
