import { useState } from 'react'
import { User, Bell, MapPin, Check, RotateCcw, Trash2, Database, Zap, RefreshCw } from 'lucide-react'
import type { UserSession } from '../types'
import { database } from '../database'

interface SettingsViewProps {
  session: UserSession | null
  onUpdateProfile: (name: string, email: string, city?: string) => void
  onToast: (msg: string) => void
}

export function SettingsView({ session, onUpdateProfile, onToast }: SettingsViewProps) {
  const userLoc = database.getLocation()

  const [name, setName] = useState(session?.name || '')
  const [email, setEmail] = useState(session?.email || '')
  const [city, setCity] = useState(userLoc.city || 'Pune')
  const [ward, setWard] = useState(session?.ward || 'Shivajinagar - Ghole Rd (PMC Ward 1)')
  const [notifReports, setNotifReports] = useState(() => {
    try {
      const p = localStorage.getItem('cleanconnect.notif.reports')
      return p !== null ? p === 'true' : true
    } catch {
      return true
    }
  })
  const [notifPickups, setNotifPickups] = useState(() => {
    try {
      const p = localStorage.getItem('cleanconnect.notif.pickups')
      return p !== null ? p === 'true' : true
    } catch {
      return true
    }
  })
  const [notifDrives, setNotifDrives] = useState(() => {
    try {
      const p = localStorage.getItem('cleanconnect.notif.drives')
      return p !== null ? p === 'true' : false
    } catch {
      return false
    }
  })
  const [isTestingNeon, setIsTestingNeon] = useState(false)

  const handleTestNeon = async () => {
    setIsTestingNeon(true)
    const res = await database.checkNeonConnection()
    setIsTestingNeon(false)
    if (res.connected) {
      onToast(`⚡ Neon PostgreSQL connected! Latency: ${res.latencyMs}ms`)
    } else {
      onToast(`⚠️ Connection issue: ${res.error || 'Check internet connection'}`)
    }
  }

  const handleSyncNeon = async () => {
    onToast('Syncing with Neon PostgreSQL...')
    const success = await database.syncFromNeon()
    if (success) {
      onToast('✅ Synced latest records from Neon PostgreSQL!')
    } else {
      onToast('Could not sync with Neon database.')
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      onToast('Please enter a valid name')
      return
    }
    const updated = database.updateProfile(name, email, city, ward)
    try {
      localStorage.setItem('cleanconnect.notif.reports', String(notifReports))
      localStorage.setItem('cleanconnect.notif.pickups', String(notifPickups))
      localStorage.setItem('cleanconnect.notif.drives', String(notifDrives))
    } catch {
      // ignore
    }
    onUpdateProfile(updated.name, updated.email, updated.city)
    onToast(`Preferences saved! Ward: ${ward}`)
  }

  const handleClearData = () => {
    if (window.confirm('Do you want to reset all reports and start with a clean database?')) {
      database.clearAllReports()
      onToast('Reports database wiped clean!')
    }
  }

  const handleSeedPune = () => {
    database.resetDemoReports('Pune')
    onToast('Reset sample reports for Pune!')
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>User Profile & Controls</span>
            <span className="live-indicator">Active Account</span>
          </div>
          <h1>Account Settings</h1>
          <p className="page-subtitle">
            Manage your personal profile, civic notifications, and local neighborhood zone.
          </p>
        </div>
      </div>

      <div className="layout-split">
        {/* Profile Card */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Personal Details</p>
              <h2>Citizen Profile</h2>
            </div>
            <User size={18} color="var(--primary)" />
          </div>

          <form onSubmit={handleSave} className="form-stack">
            <label className="form-label">
              <span>Full Name</span>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span>Email Address</span>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> Current City
              </span>
              <select
                className="form-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {!['Pune', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'].some(
                  (c) => c.toLowerCase() === city.toLowerCase()
                ) && <option value={city}>{city}</option>}
                <option value="Pune">Pune, Maharashtra</option>
                <option value="Mumbai">Mumbai, Maharashtra</option>
                <option value="Bengaluru">Bengaluru, Karnataka</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad, Telangana</option>
                <option value="Chennai">Chennai, Tamil Nadu</option>
                <option value="Kolkata">Kolkata, West Bengal</option>
                <option value="Ahmedabad">Ahmedabad, Gujarat</option>
              </select>
            </label>

            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> Primary Residential Ward
              </span>
              <select
                className="form-select"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              >
                <option>Shivajinagar - Ghole Rd (PMC Ward 1)</option>
                <option>Kothrud - Karve Rd (PMC Ward 2)</option>
                <option>Viman Nagar - Nagar Rd (PMC Ward 3)</option>
                <option>Koregaon Park (PMC Ward 4)</option>
                <option>Hinjewadi - PCMC Tech Corridor</option>
                <option>Indira Nagar, Bengaluru (Ward 80)</option>
                <option>Bandra West, Mumbai</option>
              </select>
            </label>

            <button type="submit" className="primary-btn" style={{ marginTop: '12px' }}>
              <Check size={16} /> Save Profile Changes
            </button>
          </form>
        </section>

        {/* Notifications & Data Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <p>Preferences</p>
                <h2>Notifications & Privacy</h2>
              </div>
              <Bell size={18} color="var(--primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                    Waste Report Updates
                  </strong>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    Get notified when a crew is assigned or resolves your spot
                  </small>
                </div>
                <input
                  type="checkbox"
                  checked={notifReports}
                  onChange={(e) => setNotifReports(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                    Pickup Reminders & ETA
                  </strong>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    Receive SMS alerts when collection vehicle is 10 mins away
                  </small>
                </div>
                <input
                  type="checkbox"
                  checked={notifPickups}
                  onChange={(e) => setNotifPickups(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                    Community Cleanup Invites
                  </strong>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    Weekly notifications for local volunteer drives
                  </small>
                </div>
                <input
                  type="checkbox"
                  checked={notifDrives}
                  onChange={(e) => setNotifDrives(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          </section>

          {/* Database & Storage Management */}
          <section className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="panel-header" style={{ marginBottom: '8px' }}>
              <div className="panel-title-wrap">
                <p>Cloud & Local Engine</p>
                <h2>Database Operations</h2>
              </div>
              <Database size={18} color="var(--primary)" />
            </div>

            {database.isNeonConfigured() && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      boxShadow: '0 0 6px var(--primary)',
                    }}
                  />
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                      Neon PostgreSQL Cloud Database
                    </strong>
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Active serverless cloud connection · Live sync enabled
                    </small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={handleTestNeon}
                    disabled={isTestingNeon}
                  >
                    <Zap size={13} /> {isTestingNeon ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={handleSyncNeon}
                  >
                    <RefreshCw size={13} /> Sync Now
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Control your database records. Clear sample data to start with fresh live entries, or reset sample data.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="outline-btn"
                style={{ color: 'var(--rose)', borderColor: 'var(--rose-border)' }}
                onClick={handleClearData}
              >
                <Trash2 size={14} /> Clear All Reports Data
              </button>
              <button
                type="button"
                className="outline-btn"
                onClick={handleSeedPune}
              >
                <RotateCcw size={14} /> Reset Pune Sample Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
