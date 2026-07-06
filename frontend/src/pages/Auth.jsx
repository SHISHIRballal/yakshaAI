import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()

  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const defaultRole = searchParams.get('role') || 'organizer'

  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Register form
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: defaultRole, phone: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(loginForm.email, loginForm.password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'artist') navigate('/artist/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const user = await register(regForm.name, regForm.email, regForm.password, regForm.role, regForm.phone)
      if (user.role === 'artist') navigate('/artist/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(196,30,58,0.08) 0%, transparent 60%)',
      padding: 'var(--space-8)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎭</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-1)' }}>
            Welcome to <span className="gradient-text">YakshaAI</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Karnataka's Yakshagana booking platform
          </p>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-8)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                style={{
                  flex: 1, padding: 'var(--space-3)', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  background: tab === t ? 'var(--color-surface-3)' : 'none',
                  color: tab === t ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  fontWeight: tab === t ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'all var(--transition-fast)',
                }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" required placeholder="your@email.com"
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" required placeholder="••••••••"
                  value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>

              {/* Demo credentials */}
              <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Demo Credentials
                </div>
                {[
                  { role: 'Admin', email: 'admin@yakshagai.com', pw: 'Admin@1234' },
                  { role: 'Artist', email: 'balakrishna@yakshagai.com', pw: 'Artist@1234' },
                  { role: 'Organizer', email: 'raghav.org@yakshagai.com', pw: 'Organizer@1234' },
                ].map(d => (
                  <div key={d.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <strong style={{ color: 'var(--color-gold)' }}>{d.role}:</strong> {d.email}
                    </span>
                    <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      onClick={() => setLoginForm({ email: d.email, password: d.pw })}>
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              {/* Role selection */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>I am joining as...</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[
                    { value: 'organizer', icon: '📋', label: 'Event Organizer', desc: 'Book artists for my events' },
                    { value: 'artist', icon: '🎭', label: 'Yakshagana Artist', desc: 'Offer my performances' },
                  ].map(r => (
                    <div key={r.value} onClick={() => setRegForm(f => ({ ...f, role: r.value }))}
                      style={{
                        padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${regForm.role === r.value ? 'var(--color-gold)' : 'var(--color-border)'}`,
                        cursor: 'pointer', textAlign: 'center',
                        background: regForm.role === r.value ? 'rgba(212,175,55,0.08)' : 'var(--color-surface-2)',
                        transition: 'all var(--transition-fast)',
                      }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{r.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>{r.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required placeholder="Your name"
                    value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" placeholder="+91 XXXXXXXXXX"
                    value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" required placeholder="your@email.com"
                  value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" required placeholder="Min 6 characters"
                    value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" className="form-input" required placeholder="Repeat password"
                    value={regForm.confirmPassword} onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                </div>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

              <button type="submit" className="btn btn-gold w-full btn-lg" disabled={loading}>
                {loading ? '⏳ Creating account...' : '✨ Create My Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 'var(--space-3)' }}>
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
