import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Send,
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  Eye,
  FileDown,
  User,
  AlertTriangle,
  Trash2,
  Building2,
} from 'lucide-react'
import type { StoredReport, StoredPickup, WardMetric, DriverAvailabilitySlot } from '../types'
import { database } from '../database'
import { municipalDrivers } from '../utils/fleetData'
import { getGoogleMapsUrl } from '../utils/geoUtils'

interface AdminViewProps {
  reports: StoredReport[]
  pickups?: StoredPickup[]
  onRefreshReports: () => void
  onRefreshPickups?: () => void
  onSelectReport?: (report: StoredReport) => void
  onToast: (msg: string) => void
}

export function AdminView({
  reports,
  pickups = [],
  onRefreshReports,
  onRefreshPickups,
  onSelectReport,
  onToast,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'triage' | 'pickups' | 'fleet' | 'wards'>('triage')
  const [triageFilter, setTriageFilter] = useState<'Active' | 'Unassigned' | 'In progress' | 'Resolved' | 'All'>('Active')
  const [pickupFilter, setPickupFilter] = useState<'All' | 'Requested' | 'Accepted' | 'En route' | 'Completed'>('All')

  // Driver options: Merge custom active driver profile with municipal fleet drivers
  const activeDriver = database.getDriverProfile()
  const allDrivers = useMemo(() => {
    const list = [
      {
        id: activeDriver.id || 'DRV-ACTIVE',
        name: activeDriver.name,
        phone: activeDriver.phone,
        vehicleNumber: activeDriver.vehicleNumber,
        vehicleType: activeDriver.vehicleType,
        zone: activeDriver.zone,
        depot: activeDriver.depot,
        status: activeDriver.status,
      },
      ...municipalDrivers
        .filter((d) => d.name !== activeDriver.name && d.phone !== activeDriver.phone)
        .map((d) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          vehicleNumber: d.vehicleNumber,
          vehicleType: 'Electric Tipper Truck (2.5T)',
          zone: d.zone,
          depot: 'Central Fleet Depot',
          status: d.status,
        })),
    ]
    return list
  }, [activeDriver])

  const [selectedDriver, setSelectedDriver] = useState(
    `${allDrivers[0]?.name || 'Ravi Kumar'} (${allDrivers[0]?.vehicleNumber || 'MH 12 AB 2840'})`
  )
  const [selectedPickupDriver, setSelectedPickupDriver] = useState(
    `${allDrivers[0]?.name || 'Ravi Kumar'} (${allDrivers[0]?.vehicleNumber || 'MH 12 AB 2840'})`
  )

  const wards: WardMetric[] = database.getWards()
  const availabilitySlots: DriverAvailabilitySlot[] = database.getDriverAvailability()

  // Real-time dynamic KPI calculations
  const totalReportsCount = reports.length || 1
  const resolvedReportsCount = reports.filter((r) => r.status === 'Resolved').length
  const cleanlinessIndex = Math.min(99, Math.round(74 + (resolvedReportsCount / totalReportsCount) * 24.8))
  const tonnageCleared = (resolvedReportsCount * 0.35 + pickups.filter((p) => p.status === 'Completed').length * 0.12 + 1.8).toFixed(1)
  const openReportsCount = reports.filter((r) => r.status !== 'Resolved').length
  const activeFleetCount = allDrivers.filter((d) => d.status !== 'Off Duty').length

  // Filtered reports
  const triageReports = useMemo(() => {
    return reports.filter((r) => {
      if (triageFilter === 'Unassigned') return r.status === 'Submitted'
      if (triageFilter === 'In progress') return r.status === 'In progress' || r.status === 'Team on way'
      if (triageFilter === 'Resolved') return r.status === 'Resolved'
      if (triageFilter === 'Active') return r.status !== 'Resolved'
      return true
    })
  }, [reports, triageFilter])

  // Filtered pickups
  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => {
      if (pickupFilter === 'All') return true
      return p.status === pickupFilter
    })
  }, [pickups, pickupFilter])

  // Handlers
  const handleDispatchReport = (reportId: string) => {
    const driver = allDrivers.find((d) => selectedDriver.includes(d.name)) || allDrivers[0]
    database.assignReportToDriver(reportId, driver.name, driver.vehicleNumber, driver.phone)
    onRefreshReports()
    onToast(`✅ Report ${reportId} dispatched to Driver ${driver.name} (${driver.phone})!`)
  }

  const handleUpdateReportStatus = (reportId: string, status: StoredReport['status']) => {
    database.updateReport(reportId, { status })
    onRefreshReports()
    onToast(`Report ${reportId} status updated to "${status}"`)
  }

  const handleUpdatePickupStatus = (pickupId: string, status: StoredPickup['status']) => {
    database.updatePickupStatus(pickupId, status)
    if (onRefreshPickups) onRefreshPickups()
    onToast(`Pickup ${pickupId} status updated to "${status}"`)
  }

  const handleReassignPickup = (pickupId: string) => {
    const driver = allDrivers.find((d) => selectedPickupDriver.includes(d.name)) || allDrivers[0]
    database.reassignPickup(pickupId, driver.name, driver.vehicleNumber, driver.phone)
    if (onRefreshPickups) onRefreshPickups()
    onToast(`✅ Pickup ${pickupId} reassigned to Driver ${driver.name} (${driver.phone})!`)
  }

  const handleDeleteSlot = (slotId: string) => {
    database.deleteDriverAvailabilitySlot(slotId)
    onToast('Availability slot removed from shift roster')
  }

  const handleExportSlaReport = () => {
    const timestamp = new Date().toISOString()
    const csvContent = [
      ['CleanConnect Municipal Ward SLA & Operations Audit Report'],
      ['Generated At', timestamp],
      ['City', database.getLocation().city || 'Pune'],
      ['City Cleanliness Score', `${cleanlinessIndex}%`],
      ['Total Citizen Reports Logged', reports.length],
      ['Reports Resolved', resolvedReportsCount],
      ['Open Incident Backlog', openReportsCount],
      ['Total Doorstep Pickups Scheduled', pickups.length],
      ['Pickups Completed', pickups.filter((p) => p.status === 'Completed').length],
      ['Active Municipal Fleet Size', `${activeFleetCount} / ${allDrivers.length}`],
      ['Estimated Daily Tonnage Diverted', `${tonnageCleared} Tonnes`],
      [''],
      ['Ward Name', 'Cleanliness Score', 'Open Tickets', 'Active Fleet', 'Status'],
      ...wards.map((w) => [w.name, `${w.cleanlinessScore}%`, w.openReports, `${w.activeFleet} trucks`, w.status]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cleanconnect-ward-sla-report-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onToast('✅ Ward SLA Report generated and downloaded for Municipal Commissioner!')
  }

  return (
    <div className="page-content">
      {/* Admin Command Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Municipal Operations Command Center</span>
            <span className="live-indicator">City Grid Operational</span>
          </div>
          <h1>Civic Administration Dashboard</h1>
          <p className="page-subtitle">
            Centralized fleet telemetry, automated citizen report triage, doorstep logistics, and ward analytics.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          style={{ width: 'auto' }}
          onClick={handleExportSlaReport}
        >
          <FileDown size={16} /> Generate Ward SLA Report
        </button>
      </div>

      {/* Real-time Admin KPI Bar */}
      <div className="admin-kpi-bar" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">City Cleanliness Index</span>
            <strong className="stat-value">{cleanlinessIndex}%</strong>
            <span className="stat-trend">Based on {resolvedReportsCount} resolved reports</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Waste Cleared Today</span>
            <strong className="stat-value">{tonnageCleared} T</strong>
            <span className="stat-trend">Target: 6.0 Tonnes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Truck size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Active Municipal Fleet</span>
            <strong className="stat-value">{activeFleetCount} / {allDrivers.length}</strong>
            <span className="stat-trend">Crews active on city grid</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Active Incident Queue</span>
            <strong className="stat-value">{openReportsCount} Pending</strong>
            <span className="stat-trend">{pickups.length} Doorstep Bookings</span>
          </div>
        </div>
      </div>

      {/* Operations Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'triage' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'triage' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'triage' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <AlertTriangle size={15} /> Incident Triage ({reports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pickups')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'pickups' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'pickups' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'pickups' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Truck size={15} /> Doorstep Pickups ({pickups.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'fleet' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'fleet' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'fleet' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <User size={15} /> Fleet & Shift Roster ({allDrivers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wards')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'wards' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'wards' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'wards' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Building2 size={15} /> Ward Analytics & Tonnage
        </button>
      </div>

      {/* TAB 1: Citizen Incident Triage Board */}
      {activeTab === 'triage' && (
        <section className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="panel-title-wrap">
              <p>Fleet Dispatch Operations</p>
              <h2>Citizen Incident Reports Triage ({triageReports.length})</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="filter-pill-group">
                {(['Active', 'Unassigned', 'In progress', 'Resolved', 'All'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`filter-pill ${triageFilter === tab ? 'active' : ''}`}
                    onClick={() => setTriageFilter(tab)}
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Crew:</span>
                <select
                  className="select-filter"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {allDrivers.map((d) => (
                    <option key={d.name} value={`${d.name} (${d.vehicleNumber})`}>
                      {d.name} · {d.vehicleNumber} ({d.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {triageReports.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <strong style={{ fontSize: '14px', display: 'block' }}>No reports matching "{triageFilter}".</strong>
              <small>All civic collection routes in this category are clear.</small>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {triageReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  {/* Photo Preview if available */}
                  {report.image && (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <img
                        src={report.image}
                        alt="Spot preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {report.type}
                      </strong>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: report.priority === 'Critical' ? '#fef2f2' : report.priority === 'High' ? 'var(--rose-light)' : 'var(--bg-subtle)',
                          color: report.priority === 'Critical' ? '#991b1b' : report.priority === 'High' ? 'var(--rose)' : 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                      >
                        {report.priority}
                      </span>
                      <span className={`status-pill ${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {report.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                      {report.id} · {report.location}
                      {report.lat && report.lng && (
                        <a
                          href={getGoogleMapsUrl(report.lat, report.lng)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--sky)', marginLeft: '6px', textDecoration: 'underline' }}
                        >
                          Maps <ExternalLink size={10} style={{ display: 'inline' }} />
                        </a>
                      )}
                    </div>

                    {/* Citizen reporter & phone info */}
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Citizen Reporter: <strong>{report.reporterName || 'Citizen'}</strong>
                      {(report.citizenPhone || report.reporterPhone) && (
                        <span>
                          {' '}· Phone: <a href={`tel:${report.citizenPhone || report.reporterPhone}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>{report.citizenPhone || report.reporterPhone}</a>
                        </span>
                      )}
                      {' '}· Assigned Crew: <strong style={{ color: 'var(--text-primary)' }}>{report.assignedDriver || 'Pending'}</strong> ({report.vehicleNumber || 'No Truck'})
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Status updater dropdown */}
                    <select
                      className="form-select"
                      style={{ padding: '6px 10px', fontSize: '11.5px', width: 'auto' }}
                      value={report.status}
                      onChange={(e) => handleUpdateReportStatus(report.id, e.target.value as StoredReport['status'])}
                    >
                      <option value="Submitted">Status: Submitted</option>
                      <option value="Assigned">Status: Assigned</option>
                      <option value="Team on way">Status: Team on way</option>
                      <option value="In progress">Status: In progress</option>
                      <option value="Resolved">Status: Resolved</option>
                    </select>

                    <button
                      type="button"
                      className="outline-btn"
                      style={{ padding: '6px 12px', fontSize: '11.5px' }}
                      onClick={() => handleDispatchReport(report.id)}
                      title="Dispatch selected crew to this report"
                    >
                      <Send size={12} /> {report.assignedDriver ? 'Reassign' : 'Dispatch'}
                    </button>

                    {onSelectReport && (
                      <button
                        type="button"
                        className="outline-btn"
                        style={{ padding: '6px 10px', fontSize: '11.5px' }}
                        onClick={() => onSelectReport(report)}
                        title="View full report ticket"
                      >
                        <Eye size={12} /> View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Doorstep Pickups Logistics Board */}
      {activeTab === 'pickups' && (
        <section className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="panel-title-wrap">
              <p>Doorstep Fleet Bookings</p>
              <h2>Doorstep Waste Pickup Log ({filteredPickups.length})</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="filter-pill-group">
                {(['All', 'Requested', 'Accepted', 'En route', 'Completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`filter-pill ${pickupFilter === tab ? 'active' : ''}`}
                    onClick={() => setPickupFilter(tab)}
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Crew:</span>
                <select
                  className="select-filter"
                  value={selectedPickupDriver}
                  onChange={(e) => setSelectedPickupDriver(e.target.value)}
                >
                  {allDrivers.map((d) => (
                    <option key={d.name} value={`${d.name} (${d.vehicleNumber})`}>
                      {d.name} · {d.vehicleNumber} ({d.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredPickups.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Truck size={36} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <strong style={{ fontSize: '14px', display: 'block' }}>No doorstep bookings matching "{pickupFilter}".</strong>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredPickups.map((pickup) => (
                <div
                  key={pickup.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {pickup.type} ({pickup.quantity || 'Standard'})
                      </strong>
                      <span className={`status-pill ${pickup.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {pickup.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <Calendar size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                      Window: <strong>{pickup.date} ({pickup.timeSlot})</strong> · ID: {pickup.id}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                      Address: {pickup.address}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Citizen Contact: <a href={`tel:${pickup.contact}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>{pickup.contact}</a>
                      {' '}· Assigned Driver: <strong style={{ color: 'var(--text-primary)' }}>{pickup.driverName || 'Central Fleet'}</strong> ({pickup.vehicleNumber || 'No Truck'}) · <a href={`tel:${pickup.driverPhone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>{pickup.driverPhone}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      className="form-select"
                      style={{ padding: '6px 10px', fontSize: '11.5px', width: 'auto' }}
                      value={pickup.status}
                      onChange={(e) => handleUpdatePickupStatus(pickup.id, e.target.value as StoredPickup['status'])}
                    >
                      <option value="Requested">Status: Requested</option>
                      <option value="Accepted">Status: Accepted</option>
                      <option value="En route">Status: En route</option>
                      <option value="Completed">Status: Completed</option>
                      <option value="Cancelled">Status: Cancelled</option>
                    </select>

                    <button
                      type="button"
                      className="outline-btn"
                      style={{ padding: '6px 12px', fontSize: '11.5px' }}
                      onClick={() => handleReassignPickup(pickup.id)}
                    >
                      <Send size={12} /> Reassign Crew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Fleet Telemetry & Shift Roster */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Driver Fleet Roster */}
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>Municipal Workforce</p>
                <h2>Active Fleet Driver Roster ({allDrivers.length})</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {allDrivers.map((driver) => (
                <div
                  key={driver.name}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {driver.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: driver.status === 'On Duty' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                        color: driver.status === 'On Duty' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {driver.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Vehicle: <strong>{driver.vehicleNumber}</strong> ({driver.vehicleType || 'Tipper Truck'})
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Zone: <strong>{driver.zone}</strong>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    <a href={`tel:${driver.phone}`} style={{ color: 'inherit', fontWeight: 600 }}>{driver.phone}</a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Declared Availability Shifts Board */}
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>Doorstep Availability Calendar</p>
                <h2>Declared Driver Duty Slots ({availabilitySlots.length})</h2>
              </div>
            </div>

            {availabilitySlots.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No active driver availability slots declared in database.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {availabilitySlots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${slot.isBooked ? 'var(--primary-light)' : 'var(--border)'}`,
                      backgroundColor: slot.isBooked ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>
                        {slot.date} ({slot.timeSlot})
                      </strong>
                      <span className={`status-pill ${slot.isBooked ? 'in-progress' : 'resolved'}`} style={{ fontSize: '10.5px' }}>
                        {slot.isBooked ? `Booked (#${slot.bookedByPickupId || 'Active'})` : '🟢 Open Slot'}
                      </span>
                    </div>

                    <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Location: {slot.location} · Driver: {slot.driverName} ({slot.vehicleNumber})
                    </small>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <a href={`tel:${slot.driverPhone}`} style={{ color: 'var(--primary)', fontSize: '11px', textDecoration: 'underline' }}>
                        {slot.driverPhone}
                      </a>
                      {!slot.isBooked && (
                        <button
                          type="button"
                          className="outline-btn"
                          style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--rose)' }}
                          onClick={() => handleDeleteSlot(slot.id)}
                          title="Remove slot"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 4: Ward Cleanliness Ranking & Waste Streams */}
      {activeTab === 'wards' && (
        <div className="layout-split" style={{ marginBottom: '24px' }}>
          {/* Ward Metrics Table */}
          <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div className="panel-title-wrap">
                <p>Municipal Jurisdictions</p>
                <h2>Ward Cleanliness Ranking</h2>
              </div>
            </div>

            <table className="ward-table">
              <thead>
                <tr>
                  <th>Ward Name</th>
                  <th>Cleanliness Score</th>
                  <th>Open Tickets</th>
                  <th>Active Fleet</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {wards.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.name}</strong>
                    </td>
                    <td>
                      <div className="score-progress-bar">
                        <div className="score-progress-fill" style={{ width: `${w.cleanlinessScore}%` }} />
                      </div>
                      <strong>{w.cleanlinessScore}%</strong>
                    </td>
                    <td>{w.openReports}</td>
                    <td>{w.activeFleet} trucks</td>
                    <td>
                      <span
                        className={`status-pill ${w.status === 'Optimal' ? 'resolved' : w.status === 'Attention' ? 'assigned' : 'submitted'}`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Waste Composition Breakdown */}
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>Tonnage Audit</p>
                <h2>Waste Stream Composition</h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span>Dry Recyclable Plastics & Paper</span>
                  <strong>38% (1.82 T)</strong>
                </div>
                <div className="impact-bar-wrap">
                  <div className="impact-bar-fill" style={{ width: '38%', backgroundColor: 'var(--sky)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span>Organic Wet Waste (Bio-Methanation)</span>
                  <strong>32% (1.53 T)</strong>
                </div>
                <div className="impact-bar-wrap">
                  <div className="impact-bar-fill" style={{ width: '32%', backgroundColor: 'var(--primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span>Construction Debris & Silt</span>
                  <strong>18% (0.86 T)</strong>
                </div>
                <div className="impact-bar-wrap">
                  <div className="impact-bar-fill" style={{ width: '18%', backgroundColor: 'var(--amber)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span>Electronic & Hazardous Discards</span>
                  <strong>12% (0.59 T)</strong>
                </div>
                <div className="impact-bar-wrap">
                  <div className="impact-bar-fill" style={{ width: '12%', backgroundColor: 'var(--rose)' }} />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              💡 <strong>Municipal Insight:</strong> Dry recyclable diversion in Pune city wards increased by 14% this month following the door-to-door segregation drive.
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
