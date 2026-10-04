import { useState, useMemo } from 'react'
import {
  Search,
  Download,
  Plus,
  MapPin,
  ChevronRight,
  Filter,
  AlertTriangle,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { StoredReport } from '../types'
import { formatRelativeTime } from '../utils/dateUtils'
import { database } from '../database'

interface ReportsViewProps {
  reports: StoredReport[]
  onOpenReportModal: () => void
  onSelectReport: (report: StoredReport) => void
  onToast: (msg: string) => void
}

export function ReportsView({
  reports,
  onOpenReportModal,
  onSelectReport,
  onToast,
}: ReportsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const handleClearAll = () => {
    if (window.confirm('Clear all reports and start fresh with an empty live database?')) {
      database.clearAllReports()
      onToast('All reports cleared. Database is now 100% fresh.')
    }
  }

  const handleResetSample = () => {
    database.resetDemoReports('Pune')
    onToast('Reset sample reports for Pune!')
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.description && report.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'All' || report.status === statusFilter
      const matchesCategory = categoryFilter === 'All' || report.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [reports, searchQuery, statusFilter, categoryFilter])

  const handleExportCSV = () => {
    const headers = ['Report ID', 'Category', 'Location', 'Status', 'Priority', 'Logged Time', 'Vehicle', 'Coordinates']
    const rows = filteredReports.map((r) => [
      r.id,
      r.type,
      `"${r.location}"`,
      r.status,
      r.priority,
      r.time,
      r.vehicleNumber || 'Unassigned',
      `"${r.lat || ''}, ${r.lng || ''}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cleanconnect-reports-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onToast(`Exported ${filteredReports.length} reports to CSV!`)
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Citizen Audit Log</span>
            <span className="live-indicator">{filteredReports.length} Records</span>
          </div>
          <h1>My Waste Reports</h1>
          <p className="page-subtitle">
            Track every reported issue from initial submission through verified civic clearance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="outline-btn"
            onClick={handleClearAll}
            title="Clear all reports to test with 100% fresh live data"
          >
            <Trash2 size={14} /> Clear All
          </button>
          <button
            type="button"
            className="outline-btn"
            onClick={handleResetSample}
            title="Reload Pune sample reports"
          >
            <RotateCcw size={14} /> Reset Pune Data
          </button>
          <button className="primary-btn" style={{ width: 'auto' }} onClick={onOpenReportModal}>
            <Plus size={16} /> New Waste Report
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, and CSV Export */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon-pos" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search report ID, category, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="Team on way">Team on way</option>
            <option value="In progress">In progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            <option value="Mixed waste">Mixed waste</option>
            <option value="Plastic & packaging">Plastic & packaging</option>
            <option value="Organic waste">Organic waste</option>
            <option value="Construction debris">Construction debris</option>
            <option value="Electronic / E-waste">E-waste</option>
            <option value="Hazardous waste">Hazardous waste</option>
          </select>

          <button
            type="button"
            className="outline-btn"
            onClick={handleExportCSV}
            title="Download CSV table"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="panel" style={{ padding: '8px 16px' }}>
        {filteredReports.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Filter size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <strong style={{ display: 'block', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No matching reports found
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Try adjusting your search terms or clearing your status filters.
            </p>
          </div>
        ) : (
          <div className="report-list" style={{ marginTop: '8px' }}>
            {filteredReports.map((report) => (
              <button
                key={report.id}
                className="report-item-card"
                onClick={() => onSelectReport(report)}
              >
                <div className={`report-category-icon ${report.priority.toLowerCase()}`}>
                  {report.icon}
                </div>

                <div className="report-main-info">
                  <div className="report-title-row">
                    <strong>{report.type}</strong>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {report.id}
                    </span>
                  </div>
                  <div className="report-location-sub">
                    <MapPin size={12} /> {report.location}
                  </div>
                </div>

                {/* Priority Badge */}
                <span
                  style={{
                    fontSize: '11px',
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
                  {report.priority}
                </span>

                {/* Status Badge */}
                <span className={`status-pill ${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {report.status}
                </span>

                <span className="report-time-stamp">{formatRelativeTime(report.createdAt)}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

