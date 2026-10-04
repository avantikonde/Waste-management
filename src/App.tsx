import { useState, useEffect } from 'react'
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
import { reverseGeocode } from './utils/geoUtils'
import './App.css'

// Modular Components
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { ReportModal } from './components/ReportModal'
import { PickupModal } from './components/PickupModal'
import { ReportDetailsModal } from './components/ReportDetailsModal'
import { RewardsModal } from './components/RewardsModal'

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
  const [role, setRole] = useState<'Citizen' | 'Driver' | 'Admin'>('Citizen')
  const [activeNav, setActiveNav] = useState('Overview')
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

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => {
      setToast((curr) => (curr === message ? '' : curr))
    }, 3600)
  }

  // Automatic Live GPS Tracker on mount & watch
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          try {
            const geo = await reverseGeocode(lat, lng)
            const liveLoc: UserLocationState = {
              city: geo.city,
              area: geo.area,
              lat,
              lng,
              isLiveGps: true,
            }
            database.setLocation(liveLoc)
            setUserLoc(liveLoc)
            showToast(`📍 Live Location Active: ${geo.area}, ${geo.city}`)
          } catch {
            const liveLoc: UserLocationState = {
              city: 'Current Location',
              area: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
              lat,
              lng,
              isLiveGps: true,
            }
            database.setLocation(liveLoc)
            setUserLoc(liveLoc)
          }
        },
        (err) => {
          console.log('Live geolocation note:', err.message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )

      // Continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const cur = database.getLocation()
          if (Math.hypot(cur.lat - lat, cur.lng - lng) > 0.0002) {
            const updated: UserLocationState = { ...cur, lat, lng, isLiveGps: true }
            database.setLocation(updated)
            setUserLoc(updated)
          }
        },
        null,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  const handleRefreshGps = () => {
    if ('geolocation' in navigator) {
      showToast('🛰️ Acquiring live GPS satellite fix...')
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const geo = await reverseGeocode(lat, lng)
          const liveLoc: UserLocationState = {
            city: geo.city,
            area: geo.area,
            lat,
            lng,
            isLiveGps: true,
          }
          database.setLocation(liveLoc)
          setUserLoc(liveLoc)
          showToast(`📍 Live GPS confirmed: ${geo.area}, ${geo.city}`)
        },
        (err) => {
          showToast(`Could not acquire GPS: ${err.message}`)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    } else {
      showToast('Geolocation is not supported by your browser')
    }
  }

  // Subscribe to live database changes
  useEffect(() => {
    return subscribeToDatabase(() => {
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
    })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    database.setTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((curr) => (curr === 'light' ? 'dark' : 'light'))
  }

  const handleRoleChange = (newRole: 'Citizen' | 'Driver' | 'Admin') => {
    setRole(newRole)
    if (newRole === 'Driver') {
      setActiveNav('Driver Dashboard')
    } else if (newRole === 'Admin') {
      setActiveNav('Admin Command')
    } else {
      setActiveNav('Overview')
    }
    showToast(`Switched to ${newRole} workspace`)
  }

  const handleSignIn = (email: string, pass: string): boolean => {
    const userSession = database.signIn(email, pass)
    if (userSession) {
      setSession(userSession)
      return true
    }
    return false
  }

  const handleSignUp = (name: string, email: string, pass: string): boolean => {
    const existing = database.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existing) return false

    const newSession = database.register({
      name,
      email,
      password: pass,
      role: 'Citizen',
      greenPoints: 1240,
      createdAt: new Date().toISOString(),
    })
    setSession(newSession)
    return true
  }

  const handleSignOut = () => {
    database.signOut()
    setSession(null)
    showToast('Signed out of CleanConnect')
  }

  const handleAddReport = (newReport: StoredReport) => {
    database.addReport(newReport)
    setReports(database.getReports())
    setGreenPoints(database.getGreenPoints())
    setNotifications(database.getNotifications())
    setModal(null)
    showToast(`${newReport.id} submitted! +50 Green Points credited.`)
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

    if (role === 'Driver') {
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

    if (role === 'Admin') {
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
              onRefreshReports={() => setReports(database.getReports())}
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
      case 'Help center':
        return <HelpView onToast={showToast} />
      case 'Settings':
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
        role={role}
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
          role={role}
          theme={theme}
          session={session}
          notifications={notifications}
          userLoc={userLoc}
          onRefreshGps={handleRefreshGps}
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
