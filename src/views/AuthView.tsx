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
} from 'lucide-react'

interface AuthViewProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSignIn: (email: string, password: string) => boolean
  onSignUp: (name: string, email: string, password: string) => boolean
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signin') {
      const success = onSignIn(email, password)
      if (!success) {
        onToast('Incorrect email or password. Please try again or create an account.')
      } else {
        onToast('Welcome back to CleanConnect!')
      }
    } else {
      if (!name.trim()) {
        onToast('Please enter your full name')
        return
      }
      const success = onSignUp(name, email, password)
      if (!success) {
        onToast('An account with this email already exists.')
      } else {
        onToast(`Account created for ${name}! Welcome.`)
      }
    }
  }

  const handleDemoAutofill = () => {
    setEmail('rohan.patil@cleanconnect.pune')
    setPassword('password123')
    setName('Rohan Patil')
    setMode('signup')
    onToast('Demo Pune citizen credentials pre-filled. Click Create Account!')
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
          © 2026 CleanConnect Civic Systems · City of Bengaluru
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
                ? 'Sign in to monitor your civic reports and collection vehicles.'
                : 'Join your neighborhood stewards and start earning Green Points.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
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

            <button type="submit" className="primary-btn" style={{ marginTop: '8px' }}>
              {mode === 'signin' ? (
                <>
                  <LogIn size={16} /> Sign In to Workspace
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Create Free Account
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
          <div className="demo-credentials-banner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Demo Browser Storage
              </strong>
              <button
                type="button"
                style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '11px', textDecoration: 'underline' }}
                onClick={handleDemoAutofill}
              >
                Autofill demo login
              </button>
            </div>
            <p>
              Data persists locally in this browser. You can seamlessly switch between Citizen, Driver, and Admin roles from the top bar.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

