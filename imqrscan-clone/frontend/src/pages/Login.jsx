import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, TrendingUp, Palette, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@qr.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err.message || 'Invalid email or password')
      return
    }
    navigate('/')
  }

  function handleGoogleClick() {
    setError('Google login is not configured. Please sign in with your email and password below.')
  }

  return (
    <div className="login-split-page">
      {/* ─── Left Hero Section (Blue Brand) ─── */}
      <div className="login-hero-side">
        {/* Top Logo Badge */}
        <div className="login-hero-top">
          <div className="login-brand-badge">
            <img src="/logo.png" alt="IMPRscan" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <span className="brand-badge-text">IMPRscan</span>
          </div>
        </div>


        {/* Hero Content */}
        <div className="login-hero-body">
          <h1 className="hero-headline">
            QR codes that keep working, long after you print them.
          </h1>

          <div className="hero-features">
            <div className="hero-feature-item">
              <div className="feature-icon-box">
                <Edit3 size={18} />
              </div>
              <div className="feature-text">
                <strong>Edit any time.</strong> Change the link or page behind a printed code.
              </div>
            </div>

            <div className="hero-feature-item">
              <div className="feature-icon-box">
                <TrendingUp size={18} />
              </div>
              <div className="feature-text">
                <strong>See every scan.</strong> Where, when, and on which phone.
              </div>
            </div>

            <div className="hero-feature-item">
              <div className="feature-icon-box">
                <Palette size={18} />
              </div>
              <div className="feature-text">
                <strong>Make it yours.</strong> Colors, logo, frames, shapes, and page templates.
              </div>
            </div>
          </div>

          {/* Floating Widget Card */}
          <div className="hero-floating-card">
            <div className="mini-qr-grid">
              <div className="mini-qr-corner tl" />
              <div className="mini-qr-corner tr" />
              <div className="mini-qr-corner bl" />
              <div className="mini-qr-dots">
                <span /><span /><span />
                <span /><span /><span />
                <span /><span /><span />
              </div>
            </div>
            <div className="floating-card-info">
              <div className="floating-card-title">Spring menu</div>
              <div className="floating-card-status">
                <span className="status-live-dot" />
                Live · edited today
              </div>
            </div>
          </div>
        </div>

        {/* Hero Footer */}
        <div className="login-hero-footer">
          <strong>2,420+</strong> dynamic QR codes · <strong>21,279+</strong> scans tracked, and counting
        </div>
      </div>

      {/* ─── Right Form Section (Clean White) ─── */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Welcome back</h2>
            <p>Log in to manage your QR codes.</p>
          </div>


          <form onSubmit={handleSubmit} className="login-actual-form">
            {error && <div className="login-error-alert">{error}</div>}

            <div className="login-field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(v => !v)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>


            <button
              type="submit"
              className="btn-continue-blue"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          <div className="login-bottom-links">
            <p className="account-prompt">
              New to IMPRscan?{' '}
              <a href="#signup" onClick={e => { e.preventDefault(); setError('Contact administrator for registration.'); }}>
                Create a free account
              </a>
            </p>
            <p className="legal-copy">
              © 2026 IMPRscan · Privacy · Terms
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
