import { Activity, CheckCircle2, Truck, Bell, FileText } from 'lucide-react'
import { database } from '../database'
import { formatRelativeTime } from '../utils/dateUtils'

export function ActivityView() {
  const reports = database.getReports()
  const pickups = database.getPickups()
  const notifications = database.getNotifications()

  // Synthesize dynamic activity feed from live database items
  interface ActivityItem {
    id: string
    title: string
    time: string
    category: string
    icon: typeof Activity
    desc: string
    timestamp: number
  }

  const items: ActivityItem[] = []

  // Add reports activity
  reports.slice(0, 5).forEach((r) => {
    const ts = r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
    items.push({
      id: `act-rep-${r.id}`,
      title: `Civic Report ${r.id} (${r.type})`,
      time: formatRelativeTime(r.createdAt) || 'Recent',
      category: 'Report',
      icon: r.status === 'Resolved' ? CheckCircle2 : FileText,
      desc: `${r.location} · Status: ${r.status}${r.assignedDriver ? ` · Assigned to ${r.assignedDriver}` : ''}`,
      timestamp: ts,
    })
  })

  // Add pickups activity
  pickups.slice(0, 4).forEach((p) => {
    const ts = p.createdAt ? new Date(p.createdAt).getTime() : Date.now() - 3600000
    items.push({
      id: `act-pick-${p.id}`,
      title: `Doorstep Collection: ${p.id}`,
      time: p.createdAt ? formatRelativeTime(p.createdAt) : p.date,
      category: 'Pickup',
      icon: Truck,
      desc: `${p.type} (${p.quantity || '10-25 kg'}) scheduled for ${p.date} · ${p.address}`,
      timestamp: ts,
    })
  })

  // Add system notifications
  notifications.slice(0, 3).forEach((n) => {
    const ts = n.createdAt ? new Date(n.createdAt).getTime() : Date.now() - 7200000
    items.push({
      id: `act-notif-${n.id}`,
      title: n.title,
      time: n.time || 'Recently',
      category: 'System',
      icon: Bell,
      desc: n.message,
      timestamp: ts,
    })
  })

  // Sort descending by timestamp
  items.sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Audit Trail</span>
            <span className="live-indicator">Live Activity Stream</span>
          </div>
          <h1>System Activity Timeline</h1>
          <p className="page-subtitle">
            A transparent, live record of civic reports, driver dispatches, and doorstep collections.
          </p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '850px' }}>
        <div className="panel-header">
          <div className="panel-title-wrap">
            <p>Chronological Stream</p>
            <h2>Live Neighborhood Events ({items.length})</h2>
          </div>
          <Activity size={18} color="var(--primary)" />
        </div>

        <div className="timeline-stepper" style={{ paddingLeft: '32px' }}>
          {items.map((e) => {
            const Icon = e.icon
            return (
              <div key={e.id} className="timeline-step completed">
                <div
                  className="step-marker"
                  style={{
                    backgroundColor: 'var(--primary-light)',
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon size={14} />
                </div>
                <div className="step-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <strong>{e.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {e.time}
                    </span>
                  </div>
                  <small style={{ marginTop: '3px' }}>{e.desc}</small>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
