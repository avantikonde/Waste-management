import { useState } from 'react'
import {
  Recycle,
  Check,
  LogIn,
  UserPlus,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  User,
  Truck,
} from 'lucide-react'

interface AuthViewProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSignIn: (email: string, password: string) => boolean | Promise<boolean>
  onSignUp: (name: string, email: string, password: string, role: 'Citizen' | 'Driver' | 'Admin') => boolean | Promise<boolean>
  onToast: (msg: string) => void
}

export function AuthView({
  theme,
  onToggleTheme,
  onSignIn,
  onSignUp,
  onToast,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [selectedRole, setSelectedRole] = useState<'Citizen' | 'Driver' | 'Admin'>('Citizen')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (mode === 'signin') {
        const success = await onSignIn(email, password)
        if (!success) {
          onToast('Incorrect email or password. Please try again or create an account.')
        } else {
          onToast('Welcome to CleanConnect! Connected to database.')
        }
      } else {
        if (!name.trim()) {
          onToast('Please enter your full name')
          return
        }
        const success = await onSignUp(name, email, password, selectedRole)
        if (!success) {
          onToast('An account with this email already exists.')
        } else {
          onToast(`Account created as ${selectedRole} for ${name}! Saved to database.`)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = (demoRole: 'Citizen' | 'Driver' | 'Admin') => {
    if (demoRole === 'Citizen') {
      setEmail('rohan.patil@cleanconnect.pune')
      setPassword('password123')
      setName('Rohan Patil')
      setSelectedRole('Citizen')
      onToast('Autofilled Citizen demo account (Rohan Patil). Click Sign In!')
    } else if (demoRole === 'Driver') {
      setEmail('driver.ravi@cleanconnect.pune')
      setPassword('password123')
      setName('Driver Ravi Kumar')
      setSelectedRole('Driver')
      onToast('Autofilled Driver crew demo account (Ravi Kumar). Click Sign In!')
    } else {
      setEmail('admin.deshmukh@cleanconnect.pune')
      setPassword('password123')
      setName('Supervisor Deshmukh')
      setSelectedRole('Admin')
      onToast('Autofilled Municipal Admin demo account (Supervisor Deshmukh). Click Sign In!')
    }
    setMode('signin')
  }

  return (
    <main className="auth-container">
      {/* Left Visual Brand Side */}
      <div className="auth-hero-side">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark" style={{ background: '#ffffff', color: '#065f46' }}>
            <Recycle size={22} />
          </div>
          <div className="brand-text" style={{ color: '#ffffff' }}>
            Clean<span>Connect</span>
          </div>
        </div>

        <div className="auth-hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)', marginBottom: '16px' }}>
            <Sparkles size={14} /> Next-Gen Civic Tech
          </div>
          <h1>A cleaner city starts with one small civic action.</h1>
          <p>
            Connect directly with municipal collection fleets, report neighborhood waste spots with auto-GPS, and earn Green Points for verified environmental diversion.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feature-check">
                <Check size={14} />
              </div>
              <span>Instant GPS location & category detection</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-check">
                <Check size={14} />
              </div>
              <span>Real-time municipal fleet tracking with live ETA</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-check">
                <Check size={14} />
              </div>
              <span>Green Points rewards redeemable for Metro passes & gear</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', opacity: 0.75 }}>
          © 2026 CleanConnect Civic Municipal Systems · Smart Sanitation Grid
        </div>
      </div>

      {/* Right Form Side */}
      <div className="auth-form-side">
        <button
          className="icon-btn auth-theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle Light / Dark theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="auth-box">
          <div className="auth-box-header">
            <h2>{mode === 'signin' ? 'Welcome back' : 'Create an account'}</h2>
            <p>
              {mode === 'signin'
                ? 'Sign in to access your designated municipal workspace.'
                : 'Select your account role to join Pune’s smart sanitation network.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            {mode === 'signup' && (
              <div className="auth-role-picker" style={{ marginBottom: '14px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Select Account Role
                </span>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                  }}
                >
                  {/* Citizen Role */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Citizen')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        selectedRole === 'Citizen'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border)',
                      backgroundColor:
                        selectedRole === 'Citizen'
                          ? 'var(--primary-subtle, rgba(16, 185, 129, 0.12))'
                          : 'var(--bg-subtle)',
                      color:
                        selectedRole === 'Citizen'
                          ? 'var(--primary)'
                          : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <User size={20} />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Citizen</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Resident</span>
                  </button>

                  {/* Driver Role */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Driver')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        selectedRole === 'Driver'
                          ? '2px solid #0284c7'
                          : '1px solid var(--border)',
                      backgroundColor:
                        selectedRole === 'Driver'
                          ? 'rgba(2, 132, 199, 0.12)'
                          : 'var(--bg-subtle)',
                      color:
                        selectedRole === 'Driver'
                          ? '#0284c7'
                          : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <Truck size={20} />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Driver</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Fleet Crew</span>
                  </button>

                  {/* Admin Role */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Admin')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        selectedRole === 'Admin'
                          ? '2px solid #f59e0b'
                          : '1px solid var(--border)',
                      backgroundColor:
                        selectedRole === 'Admin'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'var(--bg-subtle)',
                      color:
                        selectedRole === 'Admin'
                          ? '#d97706'
                          : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <ShieldCheck size={20} />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Admin</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Supervisor</span>
                  </button>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4',
                  }}
                >
                  {selectedRole === 'Citizen' &&
                    '👤 Citizen: Report waste spots, book doorstep pickups & earn Green Points.'}
                  {selectedRole === 'Driver' &&
                    '🚛 Driver: Dedicated crew console, route stops & clearance verification.'}
                  {selectedRole === 'Admin' &&
                    '🛡️ Admin: Municipal supervisor board, fleet oversight & ward analytics.'}
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <label className="form-label">
                <span>Full Name</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="form-label">
              <span>Email Address</span>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span>Password</span>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            <button type="submit" className="primary-btn" style={{ marginTop: '8px' }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Sparkles size={16} /> Authenticating...
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={16} /> Sign In to Workspace
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Create {selectedRole} Account
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch-link"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>

          {/* Quick Demo Autofill helper */}
          <div className="demo-credentials-banner" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                <ShieldCheck size={14} /> Quick Demo Accounts
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1-click autofill</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('Citizen')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Autofill Citizen (Rohan Patil)"
              >
                <User size={13} style={{ color: 'var(--primary)' }} />
                <span>Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('Driver')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Autofill Driver (Ravi Kumar)"
              >
                <Truck size={13} style={{ color: '#0284c7' }} />
                <span>Driver</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('Admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Autofill Admin (Supervisor Deshmukh)"
              >
                <ShieldCheck size={13} style={{ color: '#f59e0b' }} />
                <span>Admin</span>
              </button>
            </div>

            <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Connected to live Neon PostgreSQL database. Accounts strictly lock to their designated role workspace.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

