import { useState } from 'react'
import {
  ShieldCheck,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react'
import type { StoredReport, WardMetric } from '../types'
import { database } from '../database'
import { municipalDrivers } from '../utils/fleetData'

interface AdminViewProps {
  reports: StoredReport[]
  onRefreshReports: () => void
  onToast: (msg: string) => void
}

export function AdminView({ reports, onRefreshReports, onToast }: AdminViewProps) {
  const wards: WardMetric[] = database.getWards()
  const [triageFilter, setTriageFilter] = useState<'Active' | 'Unassigned' | 'All'>('Active')
  const [selectedDriver, setSelectedDriver] = useState(`${municipalDrivers[0].name} (${municipalDrivers[0].vehicleNumber})`)

  const triageReports = reports.filter((r) => {
    if (triageFilter === 'Unassigned') return r.status === 'Submitted'
    if (triageFilter === 'Active') return r.status !== 'Resolved'
    return true
  })

  const handleDispatch = (reportId: string) => {
    const driver = municipalDrivers.find((d) => selectedDriver.includes(d.name)) || municipalDrivers[0]
    database.assignReportToDriver(reportId, driver.name, driver.vehicleNumber, driver.phone)
    onRefreshReports()
    onToast(`Report ${reportId} dispatched to ${driver.name} (${driver.phone})!`)
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
            Centralized fleet telemetry, automated triage, and ward-level waste analytics.
          </p>
        </div>

        <button
          className="header-action-btn"
          onClick={() => onToast('Municipal report generated for Ward Commissioner!')}
        >
          <TrendingUp size={16} /> Generate Ward SLA Report
        </button>
      </div>

      {/* Admin KPI Bar */}
      <div className="admin-kpi-bar">
        <div className="stat-card">
          <div className="stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">City Cleanliness Index</span>
            <strong className="stat-value">88.4%</strong>
            <span className="stat-trend">+3.2% vs last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Waste Cleared Today</span>
            <strong className="stat-value">4.8 T</strong>
            <span className="stat-trend">Target: 6.0 Tonnes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Truck size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Active Municipal Fleet</span>
            <strong className="stat-value">14 / 16</strong>
            <span className="stat-trend">2 in scheduled depot maintenance</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-label">Avg SLA Resolution</span>
            <strong className="stat-value">42 min</strong>
            <span className="stat-trend">96.8% compliance</span>
          </div>
        </div>
      </div>

      {/* Live Dispatch Board */}
      <section className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="panel-title-wrap">
            <p>Fleet Dispatch Operations</p>
            <h2>Citizen Reports Triage ({triageReports.length})</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div className="filter-pill-group">
              {(['Active', 'Unassigned', 'All'] as const).map((tab) => (
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
                {municipalDrivers.map((d) => (
                  <option key={d.name} value={`${d.name} (${d.vehicleNumber})`}>
                    {d.name} · {d.vehicleNumber} ({d.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {triageReports.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
            <strong>No reports matching "{triageFilter}". All active routes are clean!</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {report.id} · {report.location} · Assigned: <strong style={{ color: 'var(--text-primary)' }}>{report.assignedDriver || 'Pending Crew'}</strong> ({report.vehicleNumber || 'No Truck'})
                  </small>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '12px' }}
                  onClick={() => handleDispatch(report.id)}
                >
                  <Send size={13} /> {report.assignedDriver ? 'Reassign Crew' : 'Dispatch Crew'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ward Cleanliness Table & Waste Composition Breakdown */}
      <div className="layout-split">
        {/* Ward Metrics */}
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
    </div>
  )
}
