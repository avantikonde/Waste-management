import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Menu,
  Moon,
  Sun,
  ShieldCheck,
  Truck,
  User,
  LogOut,
  MapPin,
} from 'lucide-react'
import type { NotificationItem, UserSession, UserLocationState } from '../types'
import { NotificationsPopover } from './NotificationsPopover'

interface NavbarProps {
  activeNav: string
  role: 'Citizen' | 'Driver' | 'Admin'
  theme: 'light' | 'dark'
  session: UserSession | null
  notifications: NotificationItem[]
  userLoc?: UserLocationState
  onRefreshGps?: () => void
  onOpenLocationPicker?: () => void
  onToggleTheme: () => void
  onChangeRole: (role: 'Citizen' | 'Driver' | 'Admin') => void
  onToggleMobileMenu: () => void
  onSignOut: () => void
  onMarkAllNotificationsRead: () => void
  onNotificationClick: (item: NotificationItem) => void
}

export function Navbar({
  activeNav,
  role,
  theme,
  session,
  notifications,
  userLoc,
  onRefreshGps,
  onOpenLocationPicker,
  onToggleTheme,
  onChangeRole,
  onToggleMobileMenu,
  onSignOut,
  onMarkAllNotificationsRead,
  onNotificationClick,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const getRoleIcon = () => {
    switch (role) {
      case 'Driver':
        return <Truck size={14} />
      case 'Admin':
        return <ShieldCheck size={14} />
      default:
        return <User size={14} />
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        <div className="breadcrumb">
          <span>{role} Workspace</span>
          <span>/</span>
          <strong>{activeNav}</strong>
        </div>
      </div>

      <div className="topbar-actions" ref={popoverRef}>
        {/* Live GPS Tracking Badge & Location Picker Trigger */}
        {(onOpenLocationPicker || onRefreshGps) && (
          <button
            type="button"
            onClick={onOpenLocationPicker || onRefreshGps}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: userLoc?.isLiveGps ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-subtle)',
              border: `1px solid ${userLoc?.isLiveGps ? 'rgba(59, 130, 246, 0.35)' : 'var(--border)'}`,
              fontSize: '11.5px',
              fontWeight: 600,
              color: userLoc?.isLiveGps ? 'var(--sky)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title={userLoc?.isLiveGps ? 'Live GPS Active! Click to inspect satellite fix or change location' : 'Click to acquire your live GPS position or search location'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: userLoc?.isLiveGps ? '#3b82f6' : 'var(--text-muted)',
                boxShadow: userLoc?.isLiveGps ? '0 0 6px #3b82f6' : 'none',
              }}
            />
            <MapPin size={13} />
            <span>{userLoc?.isLiveGps ? `${userLoc.area || userLoc.city} (Live GPS)` : `${userLoc?.city || 'Locate Me'}`}</span>
          </button>
        )}

        {/* Role Selector: Locked for Citizen & Driver, Switchable only for Municipal Admin */}
        {session?.role === 'Admin' ? (
          <div className="role-pill" title="Supervisor oversight: switch workspace perspective">
            {getRoleIcon()}
            <select
              className="role-select"
              value={role}
              onChange={(e) => onChangeRole(e.target.value as 'Citizen' | 'Driver' | 'Admin')}
              aria-label="Admin View Switcher"
            >
              <option value="Admin">Admin Command</option>
              <option value="Citizen">Preview: Citizen</option>
              <option value="Driver">Preview: Driver</option>
            </select>
          </div>
        ) : session?.role === 'Driver' ? (
          <div
            className="role-pill locked-role"
            title="Account designated as Municipal Driver Crew"
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            <Truck size={14} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Driver Crew</span>
          </div>
        ) : (
          <div
            className="role-pill locked-role"
            title="Account designated as Citizen / Resident"
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            <User size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Citizen</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="icon-btn"
          onClick={() => setShowNotifications((v) => !v)}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-badge" />}
        </button>

        {showNotifications && (
          <NotificationsPopover
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAllRead={onMarkAllNotificationsRead}
            onItemClick={(item) => {
              onNotificationClick(item)
              setShowNotifications(false)
            }}
          />
        )}

        {/* User Account / Logout */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
              title={`Logged in as ${session.name} (${session.email})`}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.name}
              </span>
            </div>

            <button
              className="signout-btn"
              onClick={onSignOut}
              title={`Sign out of ${session.name}`}
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

