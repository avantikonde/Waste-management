import { useState } from 'react'
import {
  FileCheck2,
  Clock3,
  PackageCheck,
  Leaf,
  Plus,
  Truck,
  ArrowUpRight,
  MapPin,
  ChevronRight,
  TrendingUp,
  Phone,
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { StoredReport, StoredPickup } from '../types'
import { database } from '../database'
import { getFormattedToday, formatRelativeTime } from '../utils/dateUtils'

interface OverviewViewProps {
  userName: string
  reports: StoredReport[]
  pickups: StoredPickup[]
  greenPoints: number
  onOpenReportModal: () => void
  onOpenPickupModal: () => void
  onSelectReport: (report: StoredReport) => void
  onNavigate: (route: string) => void
  onToast: (msg: string) => void
}

export function OverviewView({
  userName,
  reports,
  pickups,
  greenPoints,
  onOpenReportModal,
  onOpenPickupModal,
  onSelectReport,
  onNavigate,
  onToast,
}: OverviewViewProps) {
  const [isLiveTracking, setIsLiveTracking] = useState(true)

  const pendingCount = reports.filter((r) => r.status !== 'Resolved').length
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length
  const recentReports = reports.slice(0, 4)
  const activePickup = pickups[0]

  const userLoc = database.getLocation()
  const center: [number, number] = [
    typeof userLoc?.lat === 'number' && !isNaN(userLoc.lat) ? userLoc.lat : 18.5204,
    typeof userLoc?.lng === 'number' && !isNaN(userLoc.lng) ? userLoc.lng : 73.8567,
  ]

  return (
    <div className="page-content">
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>{getFormattedToday()}</span>
            <span className="live-indicator">
              <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
              {userLoc.city} Grid Online
            </span>
          </div>
          <h1>
            Good morning, {userName ? userName.split(' ')[0] : 'Citizen'} <span>👋</span>
          </h1>
          <p className="page-subtitle">
            Together, your neighborhood in <strong>{userLoc.city}</strong> has diverted <strong>28% more waste</strong> this month.
          </p>
        </div>

        <button className="header-action-btn" onClick={() => onNavigate('Activity')}>
          <TrendingUp size={16} /> View neighborhood stats
        </button>
      </div>

      {/* Quick Action Hero Cards */}
      <div className="hero-action-grid">
        <button
          type="button"
          className="hero-action-card report-card"
          onClick={onOpenReportModal}
        >
          <div className="hero-action-icon">
            <Plus size={28} />
          </div>
          <div className="hero-action-text">
            <strong>Report Waste Incident</strong>
            <p>Spot an overflowing bin or roadside trash? Snap a photo with auto-detected GPS.</p>
          </div>
          <div className="hero-action-arrow">
            <ArrowUpRight size={20} />
          </div>
        </button>

        <button
          type="button"
          className="hero-action-card pickup-card"
          onClick={onOpenPickupModal}
        >
          <div className="hero-action-icon">
            <Truck size={28} />
          </div>
          <div className="hero-action-text">
            <strong>Book Doorstep Pickup</strong>
            <p>Schedule a designated municipal truck for household, bulk, or electronic waste.</p>
          </div>
          <div className="hero-action-arrow">
            <ArrowUpRight size={20} />
          </div>
        </button>
      </div>

      {/* 4 Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <FileCheck2 size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Total Reports</span>
            <strong className="stat-value">{String(reports.length).padStart(2, '0')}</strong>
            <span className="stat-trend">+2 this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock3 size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Pending Action</span>
            <strong className="stat-value">{String(pendingCount).padStart(2, '0')}</strong>
            <span className="stat-trend warning">Avg ETA: 35 mins</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <PackageCheck size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Cleared & Resolved</span>
            <strong className="stat-value">{String(resolvedCount).padStart(2, '0')}</strong>
            <span className="stat-trend">88% clearance rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Leaf size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Green Points</span>
            <strong className="stat-value">{greenPoints.toLocaleString()}</strong>
            <span className="stat-trend" style={{ color: 'var(--purple)' }}>
              Top 12% in {userLoc.area || userLoc.city || 'your zone'}
            </span>
          </div>
        </div>
      </div>

      {/* Split Grid: Mini Interactive Map & Recent Reports */}
      <div className="layout-split">
        {/* Real Leaflet Mini Map Preview */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>{userLoc.city} Sector · Live GIS</p>
              <h2>Live Local Waste Map</h2>
            </div>
            <button className="panel-link-btn" onClick={() => onNavigate('Nearby waste')}>
              Explore full map <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="mini-map-box">
            <MapContainer
              center={center}
              zoom={14}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User location pin - Blue Pulsing Beacon */}
              <CircleMarker
                center={center}
                radius={9}
                pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 3 }}
              >
                <Popup>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                    You Are Here {userLoc.isLiveGps ? '(Live GPS)' : ''}
                  </strong>
                  <p style={{ margin: '3px 0 0', fontSize: '11.5px' }}>{userLoc.area || userLoc.city}</p>
                </Popup>
              </CircleMarker>

              {/* Real report pins */}
              {reports.map((report) => {
                const reportStatus = report.status || 'Submitted'
                const reportPriority = report.priority || 'Medium'
                const rLat = typeof report.lat === 'number' && !isNaN(report.lat) ? report.lat : center[0]
                const rLng = typeof report.lng === 'number' && !isNaN(report.lng) ? report.lng : center[1]
                return (
                  <CircleMarker
                    key={report.id}
                    center={[rLat, rLng]}
                    radius={7}
                    pathOptions={{
                      color: reportStatus === 'Resolved' ? '#10b981' : reportPriority === 'High' ? '#e11d48' : '#d97706',
                      fillColor: reportStatus === 'Resolved' ? '#10b981' : reportPriority === 'High' ? '#e11d48' : '#d97706',
                      fillOpacity: 0.85,
                    }}
                    eventHandlers={{
                      click: () => onSelectReport(report),
                    }}
                  >
                    <Popup>
                      <div className="popup-card">
                        <strong>{report.type || 'Waste Report'}</strong>
                        <p>{report.location || userLoc.city}</p>
                        <span className={`status-pill ${reportStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {reportStatus}
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', gap: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48' }} />
                High Priority
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                In Progress
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                Resolved
              </span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>2.4 km coverage</span>
          </div>
        </section>

        {/* Recent Reports List */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Active Tickets</p>
              <h2>Your Recent Reports</h2>
            </div>
            <button className="panel-link-btn" onClick={() => onNavigate('My reports')}>
              View all ({reports.length}) <ChevronRight size={15} />
            </button>
          </div>

          <div className="report-list">
            {recentReports.map((report) => {
              const priorityClass = (report.priority || 'medium').toLowerCase()
              const statusText = report.status || 'Submitted'
              const statusClass = statusText.toLowerCase().replace(/\s+/g, '-')
              return (
                <button
                  key={report.id}
                  className="report-item-card"
                  onClick={() => onSelectReport(report)}
                >
                  <div className={`report-category-icon ${priorityClass}`}>
                    {report.icon || 'WA'}
                  </div>
                  <div className="report-main-info">
                    <div className="report-title-row">
                      <strong>{report.type || 'Waste report'}</strong>
                    </div>
                    <div className="report-location-sub">
                      <MapPin size={12} /> {report.location || userLoc.city}
                    </div>
                  </div>
                  <span className={`status-pill ${statusClass}`}>
                    {statusText}
                  </span>
                  <span className="report-time-stamp">{formatRelativeTime(report.createdAt) || report.time || 'Just now'}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* Bottom Row: Active Collection Vehicle Tracker & Monthly Impact */}
      <div className="layout-split">
        {/* Live Truck Tracker */}
        <section className="panel vehicle-tracker-card">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Dispatch Status</p>
              <h2>Doorstep Collection Vehicle</h2>
            </div>
            <span className="status-pill in-progress">
              {isLiveTracking ? 'En Route' : 'Paused'}
            </span>
          </div>

          <div className="tracker-layout">
            <div className="tracker-visual">
              <div className="tracker-route-line" />
              <div className="tracker-dot-start">
                <MapPin size={14} />
              </div>
              <div className="tracker-dot-end">
                <Truck size={14} />
              </div>
            </div>

            <div className="tracker-details">
              <strong>{activePickup?.type || 'Doorstep Waste Collection'}</strong>
              <p>{activePickup?.address || (userLoc.area ? `${userLoc.area}, ${userLoc.city}` : userLoc.city)}</p>
              <div className="tracker-meta-chips">
                <span className="tracker-chip">
                  <Truck size={13} /> {activePickup?.vehicleNumber || database.getDriverProfile().vehicleNumber}
                </span>
                <span className="tracker-chip">
                  <Clock3 size={13} /> ETA: {activePickup?.etaMinutes || 12} mins
                </span>
                <span className="tracker-chip">
                  Driver: {activePickup?.driverName || database.getDriverProfile().name}
                </span>
                <span className="tracker-chip">
                  <Phone size={13} /> {activePickup?.driverPhone || database.getDriverProfile().phone}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="outline-btn"
              style={{ flex: 1 }}
              onClick={() => {
                setIsLiveTracking((v) => !v)
                onToast(isLiveTracking ? 'Vehicle tracking paused' : 'Live tracking resumed')
              }}
            >
              {isLiveTracking ? 'Pause Tracking' : 'Resume Tracking'}
            </button>
            <button
              type="button"
              className="primary-btn"
              style={{ flex: 1.2 }}
              onClick={() => onNavigate('Nearby waste')}
            >
              Follow On Map <ArrowUpRight size={15} />
            </button>
          </div>
        </section>

        {/* Monthly Environmental Impact Card */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Community Goal</p>
              <h2>Eco Milestone</h2>
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Leaf size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '14px 0' }}>
            <strong style={{ fontSize: '42px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1.5px' }}>
              480
            </strong>
            <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              kg municipal waste<br />safely segregated & diverted
            </span>
          </div>

          <div className="impact-bar-wrap" style={{ height: '8px', marginBottom: '10px' }}>
            <div className="impact-bar-fill" style={{ width: '64%' }} />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Progress toward 750 kg goal</span>
            <strong style={{ color: 'var(--primary)' }}>64% Reached</strong>
          </div>

          <button
            type="button"
            className="outline-btn"
            style={{ width: '100%', marginTop: '18px' }}
            onClick={() => onNavigate('Community & Rewards')}
          >
            Open Rewards Center <ArrowUpRight size={14} />
          </button>
        </section>
      </div>
    </div>
  )
}

