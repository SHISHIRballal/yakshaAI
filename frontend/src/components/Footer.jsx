import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
              <div className="navbar-logo-icon">🎭</div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text)' }}>
                Yaksha<span style={{ color: 'var(--color-gold)' }}>AI</span>
              </span>
            </Link>
            <p className="footer-brand-desc">
              Karnataka's premier AI-powered platform connecting Yakshagana artists with event organizers. 
              Preserving tradition through technology.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {['🎭', '🥁', '🌟'].map((emoji, i) => (
                <div key={i} style={{
                  width: 36, height: 36,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontSize: '1rem',
                }}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/artists">Browse Artists</Link></li>
              <li><Link to="/recommendations">AI Recommendations</Link></li>
              <li><Link to="/auth?tab=register">Register as Artist</Link></li>
              <li><Link to="/auth">Book a Performance</Link></li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="footer-heading">Yakshagana</h4>
            <ul className="footer-links">
              <li><a href="#">Badagu Tittu</a></li>
              <li><a href="#">Tenkutittu</a></li>
              <li><a href="#">About Bhagavata</a></li>
              <li><a href="#">Chende & Maddale</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© 2026 YakshaAI. Made with ❤️ for Karnataka's cultural heritage.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-gold)', fontSize: '0.75rem' }}>🏛️</span>
            Preserving Yakshagana through AI
          </p>
        </div>
      </div>
    </footer>
  )
}
