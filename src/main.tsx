import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CleanConnect Error Boundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleResetStorage = () => {
    try {
      window.localStorage.clear()
    } catch (e) {
      console.error(e)
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              color: '#14281e',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#065f46' }}>
              CleanConnect Recovery
            </h1>
            <p style={{ fontSize: '14px', color: '#4b6355', margin: '0 0 20px', lineHeight: 1.5 }}>
              The application encountered an unexpected display issue. Your saved data is preserved.
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontSize: '12px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  overflowX: 'auto',
                  margin: '0 0 20px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🔄 Refresh App
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🧹 Reset Cache
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
