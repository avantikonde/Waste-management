import {
  LayoutDashboard,
  FileCheck2,
  Truck,
  Map,
  Users,
  CalendarDays,
  CircleHelp,
  Settings,
  Leaf,
  Recycle,
  Activity,
  Award,
  ShieldCheck,
} from 'lucide-react'
import type { UserSession } from '../types'

interface SidebarProps {
  activeNav: string
  role: 'Citizen' | 'Driver' | 'Admin'
  mobileOpen: boolean
  reportCount: number
  pickupCount: number
  greenPoints: number
  session: UserSession | null
  onNavigate: (route: string) => void
  onCloseMobile: () => void
}

export function Sidebar({
  activeNav,
  role,
  mobileOpen,
  reportCount,
  pickupCount,
  greenPoints,
  session,
  onNavigate,
  onCloseMobile,
}: SidebarProps) {
  const handleNav = (nav: string) => {
    onNavigate(nav)
    onCloseMobile()
  }

  interface NavItem {
    label: string
    icon: typeof LayoutDashboard
    count?: number
  }

  const citizenNav: NavItem[] = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My reports', icon: FileCheck2, count: reportCount },
    { label: 'Pickup requests', icon: Truck, count: pickupCount },
    { label: 'Nearby waste', icon: Map },
    { label: 'Community & Rewards', icon: Users },
  ]

  const driverNav: NavItem[] = [
    { label: 'Driver Dashboard', icon: Truck },
    { label: 'Route Map', icon: Map },
    { label: 'Completed Stops', icon: FileCheck2 },
  ]

  const adminNav: NavItem[] = [
    { label: 'Admin Command', icon: ShieldCheck },
    { label: 'All Citizen Reports', icon: FileCheck2, count: reportCount },
    { label: 'Fleet & Dispatch', icon: Truck },
    { label: 'Ward Analytics', icon: Activity },
  ]

  const currentNav: NavItem[] = role === 'Driver' ? driverNav : role === 'Admin' ? adminNav : citizenNav

  return (
    <>
      <div
        className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand">
          <div className="brand-mark">
            <Recycle size={22} />
          </div>
          <div className="brand-text">
            Clean<span>Connect</span>
          </div>
          <span className="brand-badge">{role}</span>
        </div>

        {/* Primary Navigation */}
        <div className="sidebar-label">Navigation</div>
        <nav className="nav-list">
          {currentNav.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.label
            return (
              <button
                key={item.label}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.label)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="nav-badge">{item.count}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Secondary Links for Citizen Mode */}
        {role === 'Citizen' && (
          <>
            <div className="sidebar-label" style={{ marginTop: '24px' }}>
              Engage
            </div>
            <nav className="nav-list">
              <button
                className={`nav-item ${activeNav === 'Cleanup drives' ? 'active' : ''}`}
                onClick={() => handleNav('Cleanup drives')}
              >
                <CalendarDays size={18} />
                <span>Cleanup drives</span>
              </button>
              <button
                className={`nav-item ${activeNav === 'Activity' ? 'active' : ''}`}
                onClick={() => handleNav('Activity')}
              >
                <Activity size={18} />
                <span>Recent activity</span>
              </button>
              <button
                className={`nav-item ${activeNav === 'Help center' ? 'active' : ''}`}
                onClick={() => handleNav('Help center')}
              >
                <CircleHelp size={18} />
                <span>Help center</span>
              </button>
            </nav>
          </>
        )}

        {/* Sidebar Footer / Monthly Impact */}
        <div className="sidebar-bottom">
          <div className="impact-card">
            <div className="impact-header">
              <div className="impact-icon-wrap">
                <Leaf size={18} />
              </div>
              <div>
                <strong>480 kg diverted</strong>
                <small>Goal: 750 kg this month</small>
              </div>
            </div>
            <div className="impact-bar-wrap">
              <div className="impact-bar-fill" style={{ width: '64%' }} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Green points:</span>
              <strong style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={13} /> {greenPoints.toLocaleString()} pts
              </strong>
            </div>
          </div>

          <button
            className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`}
            onClick={() => handleNav('Settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          {/* User Profile Info */}
          {session && (
            <div className="sidebar-user-card">
              <div className="user-avatar">
                {(
                  (session.name || 'Citizen')
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'CU'
                )}
              </div>
              <div className="user-info">
                <strong>{session.name || 'Citizen'}</strong>
                <small>{session.email || 'citizen@cleanconnect.pune'}</small>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
