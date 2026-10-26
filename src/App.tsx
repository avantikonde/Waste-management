import { useState, useEffect, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import type {
  StoredReport,
  StoredPickup,
  UserSession,
  EcoReward,
  NotificationItem,
  UserLocationState,
} from './types'
import { database, subscribeToDatabase } from './database'
import { reverseGeocode, getHighAccuracyPosition } from './utils/geoUtils'
import './App.css'

// Modular Components
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { ReportModal } from './components/ReportModal'
import { PickupModal } from './components/PickupModal'
import { ReportDetailsModal } from './components/ReportDetailsModal'
import { RewardsModal } from './components/RewardsModal'
import { LocationPickerModal } from './components/LocationPickerModal'

// Workspace Views
import { OverviewView } from './views/OverviewView'
import { ReportsView } from './views/ReportsView'
import { PickupRequestsView } from './views/PickupRequestsView'
import { NearbyWasteView } from './views/NearbyWasteView'
import { CommunityView } from './views/CommunityView'
import { DriverView } from './views/DriverView'
import { AdminView } from './views/AdminView'
import { SettingsView } from './views/SettingsView'
import { HelpView } from './views/HelpView'
import { ActivityView } from './views/ActivityView'
import { AuthView } from './views/AuthView'

type ModalType = 'report' | 'pickup' | 'rewards' | null

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => database.getSession())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => database.getTheme())
  const [role, setRole] = useState<'Citizen' | 'Driver' | 'Admin'>(() => {
    const s = database.getSession()
    return s?.role || 'Citizen'
  })
  const [activeNav, setActiveNav] = useState(() => {
    const s = database.getSession()
    if (s?.role === 'Driver') return 'Driver Dashboard'
    if (s?.role === 'Admin') return 'Admin Command'
    return 'Overview'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null)
  const [toast, setToast] = useState('')

  // App Data States backed by local database
  const [reports, setReports] = useState<StoredReport[]>(() => database.getReports())
  const [pickups, setPickups] = useState<StoredPickup[]>(() => database.getPickups())
  const [greenPoints, setGreenPoints] = useState<number>(() => database.getGreenPoints())
  const [rewards, setRewards] = useState<EcoReward[]>(() => database.getRewards())
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    database.getNotifications()
  )
  const [userLoc, setUserLoc] = useState<UserLocationState>(() => database.getLocation())
  const [showLocationPickerModal, setShowLocationPickerModal] = useState(false)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => {
      setToast((curr) => (curr === message ? '' : curr))
    }, 3600)
  }, [])

  // High-precision live GPS Tracker on mount & watch
  useEffect(() => {
    let mounted = true

    getHighAccuracyPosition()
      .then(async (fix) => {
        if (!mounted) return
        const geo = await reverseGeocode(fix.lat, fix.lng)
        const liveLoc: UserLocationState = {
          city: geo.city,
          area: geo.area,
          lat: fix.lat,
          lng: fix.lng,
          isLiveGps: true,
        }
        database.setLocation(liveLoc)
        setUserLoc(liveLoc)
        showToast(`📍 Live Location Active: ${geo.area}, ${geo.city} (±${Math.round(fix.accuracy)}m)`)
      })
      .catch((err) => {
        console.log('Location acquisition info:', err)
      })

    // Continuous watch if available
    let watchId: number | null = null
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const cur = database.getLocation()
          if (Math.hypot(cur.lat - lat, cur.lng - lng) > 0.0003) {
            const geo = await reverseGeocode(lat, lng)
            const updated: UserLocationState = {
              city: geo.city,
              area: geo.area,
              lat,
              lng,
              isLiveGps: true,
            }
            database.setLocation(updated)
            setUserLoc(updated)
          }
        },
        null,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      )
    }

    return () => {
      mounted = false
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [showToast])

  const handleRefreshGps = async () => {
    showToast('🛰️ Acquiring high-precision GPS satellite fix...')
    try {
      const fix = await getHighAccuracyPosition()
      const geo = await reverseGeocode(fix.lat, fix.lng)
      const liveLoc: UserLocationState = {
        city: geo.city,
        area: geo.area,
        lat: fix.lat,
        lng: fix.lng,
        isLiveGps: true,
      }
      database.setLocation(liveLoc)
      setUserLoc(liveLoc)
      showToast(`📍 Live GPS confirmed: ${geo.area}, ${geo.city} (±${Math.round(fix.accuracy)}m)`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast(`Could not acquire GPS: ${message}`)
    }
  }

  // Subscribe to live database changes and periodically refresh relative timestamps & Neon sync
  useEffect(() => {
    const refreshFromDb = () => {
      setReports(database.getReports())
      setPickups(database.getPickups())
      setGreenPoints(database.getGreenPoints())
      setRewards(database.getRewards())
      setNotifications(database.getNotifications())
      setUserLoc(database.getLocation())
      const currentSession = database.getSession()
      if (currentSession) {
        setSession(currentSession)
      }
    }

    const unsub = subscribeToDatabase(refreshFromDb)

    // Refresh live timestamps & sync with Neon PostgreSQL every 30 seconds
    const timerId = window.setInterval(() => {
      refreshFromDb()
      void database.syncFromNeon()
    }, 30000)

    return () => {
      unsub()
      window.clearInterval(timerId)
    }
  }, [showToast])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    database.setTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((curr) => (curr === 'light' ? 'dark' : 'light'))
  }

  const handleRoleChange = (newRole: 'Citizen' | 'Driver' | 'Admin') => {
    // Only municipal supervisor (Admin) can switch workspace perspectives
    if (session?.role !== 'Admin') {
      showToast(`Access restricted: your account is designated as ${session?.role || 'Citizen'}.`)
      return
    }
    setRole(newRole)
    if (newRole === 'Driver') {
      setActiveNav('Driver Dashboard')
    } else if (newRole === 'Admin') {
      setActiveNav('Admin Command')
    } else {
      setActiveNav('Overview')
    }
    showToast(`Supervisor: switched preview perspective to ${newRole}`)
  }

  const handleSignIn = (email: string, pass: string): boolean => {
    const userSession = database.signIn(email, pass)
    if (userSession) {
      setSession(userSession)
      setRole(userSession.role)
      if (userSession.role === 'Driver') {
        setActiveNav('Driver Dashboard')
      } else if (userSession.role === 'Admin') {
        setActiveNav('Admin Command')
      } else {
        setActiveNav('Overview')
      }
      return true
    }
    return false
  }

  const handleSignUp = (
    name: string,
    email: string,
    pass: string,
    userRole: 'Citizen' | 'Driver' | 'Admin'
  ): boolean => {
    const existing = database.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existing) return false

    const newSession = database.register({
      name,
      email,
      password: pass,
      role: userRole,
      greenPoints: userRole === 'Citizen' ? 1240 : 0,
      createdAt: new Date().toISOString(),
    })
    setSession(newSession)
    setRole(userRole)
    if (userRole === 'Driver') {
      setActiveNav('Driver Dashboard')
    } else if (userRole === 'Admin') {
      setActiveNav('Admin Command')
    } else {
      setActiveNav('Overview')
    }
    return true
  }

  const handleSignOut = () => {
    database.signOut()
    setSession(null)
    setRole('Citizen')
    setActiveNav('Overview')
    showToast('Signed out of CleanConnect')
  }

  const handleAddReport = (newReport: StoredReport) => {
    database.addReport(newReport)
    setReports(database.getReports())
    setGreenPoints(database.getGreenPoints())
    setNotifications(database.getNotifications())
    setModal(null)
    showToast(`${newReport.id} submitted! Status: Pending driver acceptance. +50 Green Points credited.`)
  }

  const handleAddPickup = (newPickup: StoredPickup) => {
    database.addPickup(newPickup)
    setPickups(database.getPickups())
    setNotifications(database.getNotifications())
    setModal(null)
    showToast(`Collection booked! Booking ID: ${newPickup.id}`)
  }

  const handleRedeemReward = (rewardId: string) => {
    const res = database.redeemReward(rewardId)
    if (res.success) {
      setGreenPoints(database.getGreenPoints())
      setRewards(database.getRewards())
      setNotifications(database.getNotifications())
      showToast(res.message)
    } else {
      showToast(res.message)
    }
  }

  const handleMarkAllNotificationsRead = () => {
    const updated = database.markAllNotificationsRead()
    setNotifications(updated)
    showToast('All notifications marked as read')
  }

  const handleNotificationClick = (item: NotificationItem) => {
    const updated = database.markNotificationRead(item.id)
    setNotifications(updated)
    if (item.type === 'report') {
      setActiveNav('My reports')
    } else if (item.type === 'pickup') {
      setActiveNav('Pickup requests')
    } else if (item.type === 'reward') {
      setModal('rewards')
    }
  }

  // If not logged in, render the Auth View
  if (!session) {
    return (
      <AuthView
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onToast={showToast}
      />
    )
  }

  // Determine effective workspace role (strictly locked for non-admins)
  const effectiveRole: 'Citizen' | 'Driver' | 'Admin' =
    session.role === 'Admin' ? role : session.role || 'Citizen'

  // Determine active view based on role & navigation
  const renderActiveView = () => {
    // Universal routes accessible across all roles
    if (activeNav === 'Settings') {
      return (
        <SettingsView
          session={session}
          onUpdateProfile={(updatedName, updatedEmail, updatedCity) => {
            setSession((curr) =>
              curr
                ? { ...curr, name: updatedName, email: updatedEmail, city: updatedCity }
                : null
            )
          }}
          onToast={showToast}
        />
      )
    }

    if (activeNav === 'Help center') {
      return <HelpView onToast={showToast} />
    }

    if (effectiveRole === 'Driver') {
      switch (activeNav) {
        case 'Route Map':
          return (
            <NearbyWasteView
              reports={reports}
              onSelectReport={setSelectedReport}
              onToast={showToast}
            />
          )
        case 'Completed Stops':
          return (
            <ReportsView
              reports={reports}
              onOpenReportModal={() => setModal('report')}
              onSelectReport={setSelectedReport}
              onToast={showToast}
            />
          )
        case 'Driver Dashboard':
        default:
          return <DriverView onToast={showToast} />
      }
    }

    if (effectiveRole === 'Admin') {
      switch (activeNav) {
        case 'All Citizen Reports':
          return (
            <ReportsView
              reports={reports}
              onOpenReportModal={() => setModal('report')}
              onSelectReport={setSelectedReport}
              onToast={showToast}
            />
          )
        case 'Doorstep Pickups':
          return (
            <PickupRequestsView
              pickups={pickups}
              onOpenPickupModal={() => setModal('pickup')}
              onNavigate={setActiveNav}
              onToast={showToast}
            />
          )
        case 'Fleet & Dispatch':
          return (
            <NearbyWasteView
              reports={reports}
              onSelectReport={setSelectedReport}
              onToast={showToast}
            />
          )
        case 'Admin Command':
        case 'Ward Analytics':
        default:
          return (
            <AdminView
              reports={reports}
              pickups={pickups}
              onRefreshReports={() => setReports(database.getReports())}
              onRefreshPickups={() => setPickups(database.getPickups())}
              onSelectReport={setSelectedReport}
              onToast={showToast}
            />
          )
      }
    }

    // Citizen Role Views
    switch (activeNav) {
      case 'My reports':
        return (
          <ReportsView
            reports={reports}
            onOpenReportModal={() => setModal('report')}
            onSelectReport={setSelectedReport}
            onToast={showToast}
          />
        )
      case 'Pickup requests':
        return (
          <PickupRequestsView
            pickups={pickups}
            onOpenPickupModal={() => setModal('pickup')}
            onNavigate={setActiveNav}
            onToast={showToast}
          />
        )
      case 'Nearby waste':
        return (
          <NearbyWasteView
            reports={reports}
            onSelectReport={setSelectedReport}
            onToast={showToast}
          />
        )
      case 'Community & Rewards':
      case 'Cleanup drives':
        return (
          <CommunityView
            greenPoints={greenPoints}
            rewards={rewards}
            onOpenRewardsModal={() => setModal('rewards')}
            onToast={showToast}
          />
        )
      case 'Activity':
        return <ActivityView />
      case 'Overview':
      default:
        return (
          <OverviewView
            userName={session.name}
            reports={reports}
            pickups={pickups}
            greenPoints={greenPoints}
            onOpenReportModal={() => setModal('report')}
            onOpenPickupModal={() => setModal('pickup')}
            onSelectReport={setSelectedReport}
            onNavigate={setActiveNav}
            onToast={showToast}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        role={effectiveRole}
        mobileOpen={mobileOpen}
        reportCount={reports.length}
        pickupCount={pickups.length}
        greenPoints={greenPoints}
        session={session}
        onNavigate={setActiveNav}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="main-content">
        {/* Top Navigation Bar */}
        <Navbar
          activeNav={activeNav}
          role={effectiveRole}
          theme={theme}
          session={session}
          notifications={notifications}
          userLoc={userLoc}
          onRefreshGps={handleRefreshGps}
          onOpenLocationPicker={() => setShowLocationPickerModal(true)}
          onToggleTheme={toggleTheme}
          onChangeRole={handleRoleChange}
          onToggleMobileMenu={() => setMobileOpen((curr) => !curr)}
          onSignOut={handleSignOut}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onNotificationClick={handleNotificationClick}
        />

        {/* Dynamic Workspace View */}
        {renderActiveView()}
      </main>

      {/* Location Picker Dialog */}
      {showLocationPickerModal && (
        <LocationPickerModal
          onClose={() => setShowLocationPickerModal(false)}
          onSelectLocation={(loc) => {
            setUserLoc(loc)
            database.setLocation(loc)
          }}
          onToast={showToast}
        />
      )}

      {/* Dialog Modals */}
      {modal === 'report' && (
        <ReportModal
          onClose={() => setModal(null)}
          onSubmit={handleAddReport}
          onToast={showToast}
        />
      )}

      {modal === 'pickup' && (
        <PickupModal
          onClose={() => setModal(null)}
          onSubmit={handleAddPickup}
        />
      )}

      {modal === 'rewards' && (
        <RewardsModal
          greenPoints={greenPoints}
          rewards={rewards}
          onClose={() => setModal(null)}
          onRedeem={handleRedeemReward}
        />
      )}

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onToast={showToast}
        />
      )}

      {/* Global Floating Toast Alert */}
      {toast && (
        <div className="toast-container" role="alert">
          <div className="toast-box">
            <span className="toast-check-icon">
              <Check size={14} />
            </span>
            <span>{toast}</span>
            <button
              className="toast-close-btn"
              onClick={() => setToast('')}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
