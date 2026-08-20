import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return null
    if (user.role === 'admin') return { href: '/admin', label: 'Admin Dashboard' }
    if (user.role === 'artist') return { href: '/artist/dashboard', label: 'My Dashboard' }
    return { href: '/dashboard', label: 'My Dashboard' }
  }

  const dashLink = getDashboardLink()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">🎭</div>
          <span className="navbar-logo-text">Yaksha<span>AI</span></span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-nav">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/artists">Artists</NavLink></li>
          <li><NavLink to="/recommendations">AI Picks</NavLink></li>
          {user && <li><NavLink to="/messages">💬 Messages</NavLink></li>}
          <li><NavLink to="/contact">Contact</NavLink></li>
          {dashLink && <li><NavLink to={dashLink.href}>{dashLink.label}</NavLink></li>}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {user && <NotificationBell />}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="navbar-user"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span>👤</span>
                <span>{user.name.split(' ')[0]}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)' }}>
                  {user.role}
                </span>
                <span>▾</span>
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-2)',
                  minWidth: '180px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                }}>
                  {dashLink && (
                    <Link
                      to={dashLink.href}
                      style={{
                        display: 'block',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text)',
                        fontSize: '0.875rem',
                        transition: 'background var(--transition-fast)',
                      }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      📊 {dashLink.label}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-error)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/auth?tab=register" className="btn btn-gold btn-sm">Join Now</Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-6)',
        }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/artists', label: 'Artists' },
              { to: '/recommendations', label: 'AI Recommendations' },
              { to: '/contact', label: 'Contact' },
              ...(dashLink ? [{ to: dashLink.href, label: dashLink.label }] : []),
            ].map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
                    fontWeight: '500',
                  })}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {user ? (
              <li>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: '500' }}>
                  Sign Out
                </button>
              </li>
            ) : (
              <li>
                <Link to="/auth" className="btn btn-gold btn-sm" onClick={() => setMenuOpen(false)}>
                  Sign In / Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  )
}
