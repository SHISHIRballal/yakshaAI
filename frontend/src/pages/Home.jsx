import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ArtistCard from '../components/ArtistCard'
import LoadingSpinner from '../components/LoadingSpinner'

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Matching', desc: 'Our ML engine analyzes budget, location, style, and ratings to find your perfect artist.' },
  { icon: '🎭', title: 'Verified Artists', desc: 'Every listed artist is reviewed and verified by our cultural experts.' },
  { icon: '📅', title: 'Real-Time Availability', desc: 'Check availability instantly and book in seconds.' },
  { icon: '⭐', title: 'Authentic Reviews', desc: 'Read genuine reviews from verified event organizers.' },
  { icon: '🔐', title: 'Secure Payments', desc: 'End-to-end encrypted booking and payment processing.' },
  { icon: '🌐', title: 'Pan-Karnataka Network', desc: 'Artists from Udupi to Dharwad, coastal to inland Karnataka.' },
]

const EVENT_TYPES = [
  { icon: '🛕', label: 'Temple Festivals' },
  { icon: '💒', label: 'Weddings' },
  { icon: '🎪', label: 'Cultural Programs' },
  { icon: '🏢', label: 'Corporate Events' },
  { icon: '🎓', label: 'College Events' },
  { icon: '🌍', label: 'International Tours' },
]

export default function Home() {
  const navigate = useNavigate()
  const [featuredArtists, setFeaturedArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/artists?limit=6&is_verified=true')
      .then(res => setFeaturedArtists(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="hero">
        <div className="hero-pattern" />
        
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '15%', right: '5%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(196,30,58,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '2%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="container">
          <div className="hero-content" style={{ gridTemplateColumns: '1fr', maxWidth: 760 }}>
            <div>
              <div className="hero-eyebrow">
                <span>✨</span>
                <span>Karnataka's #1 Yakshagana Platform</span>
              </div>

              <h1 className="hero-title">
                <span>Book Legendary</span>{' '}
                <span className="gradient-text">Yakshagana</span>{' '}
                <span>Artists with AI</span>
              </h1>

              <p className="hero-description">
                Connect with 500+ authentic Yakshagana performers across Karnataka. 
                Our AI recommends the perfect artist for your event — instantly.
              </p>

              <div className="hero-actions">
                <Link to="/recommendations" className="btn btn-primary btn-xl">
                  🤖 Get AI Recommendations
                </Link>
                <Link to="/artists" className="btn btn-outline btn-xl">
                  Browse All Artists
                </Link>
              </div>

              <div className="hero-stats">
                {[
                  { value: '500+', label: 'Verified Artists' },
                  { value: '1,200+', label: 'Events Booked' },
                  { value: '4.8★', label: 'Avg Rating' },
                  { value: '50+', label: 'Cities Covered' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="hero-stat-value">{stat.value}</div>
                    <div className="hero-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating artist cards decoration */}
        <div style={{
          position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          opacity: 0.85,
        }} className="hide-mobile">
          {[
            { name: 'Ganapathi Bhat', role: 'Bhagavata', rating: '5.0', city: 'Udupi' },
            { name: 'Anantha Bhat', role: 'Veshadhara', rating: '4.9', city: 'Mangaluru' },
          ].map((artist, i) => (
            <div key={i} className="hero-card" style={{ minWidth: 220, animationDelay: `${i * 0.5}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                }}>🎭</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{artist.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>{artist.role}</div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>📍 {artist.city}</span>
                <span style={{ color: 'var(--color-gold)' }}>★ {artist.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="section-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>
              Perfect for
            </span>
            {EVENT_TYPES.map((et) => (
              <div key={et.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}
                onClick={() => navigate('/artists')}>
                <span>{et.icon}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{et.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">Why YakshaAI</div>
            <h2 className="section-title glow-text">Built for Yakshagana Excellence</h2>
            <p className="section-description">
              A platform that honors Karnataka's 500-year-old art form with modern technology.
            </p>
          </div>
          <div className="ornament"><span className="ornament-symbol">❋</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-10)' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card" style={{ padding: 'var(--space-6)', transition: 'all var(--transition-normal)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-gold)' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ARTISTS */}
      <section className="section" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', textAlign: 'left', marginBottom: 'var(--space-8)' }}>
            <div>
              <div className="section-subtitle">Handpicked</div>
              <h2 className="section-title">Featured Artists</h2>
            </div>
            <Link to="/artists" className="btn btn-outline">View All Artists →</Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="artists-grid">
              {featuredArtists.map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">Simple Process</div>
            <h2 className="section-title">How YakshaAI Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-8)', position: 'relative' }}>
            {[
              { step: '01', icon: '🔍', title: 'Tell Us Your Needs', desc: 'Share your event date, location, budget, and preferred style.' },
              { step: '02', icon: '🤖', title: 'AI Finds Matches', desc: 'Our engine scores and ranks artists based on your preferences.' },
              { step: '03', icon: '📋', title: 'Review & Choose', desc: 'Browse matched profiles, reviews, and availability calendars.' },
              { step: '04', icon: '✅', title: 'Book Instantly', desc: 'Send a booking request and confirm with the artist directly.' },
            ].map((s, i) => (
              <div key={s.step} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto var(--space-4)',
                  background: 'linear-gradient(135deg, rgba(196,30,58,0.2), rgba(212,175,55,0.1))',
                  border: '1px solid var(--color-border)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem',
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gold)', fontWeight: 700, letterSpacing: 2, marginBottom: 'var(--space-2)' }}>
                  STEP {s.step}
                </div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                  {s.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, rgba(196,30,58,0.1) 0%, rgba(212,175,55,0.05) 50%, rgba(196,30,58,0.08) 100%)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎭</div>
          <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
            Ready to Celebrate Karnataka's Heritage?
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginBottom: 'var(--space-8)', maxWidth: 560, margin: '0 auto var(--space-8)' }}>
            Join 10,000+ event organizers who trust YakshaAI to find the perfect Yakshagana performers.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/recommendations" className="btn btn-primary btn-xl">
              🤖 Start with AI
            </Link>
            <Link to="/auth?tab=register&role=artist" className="btn btn-outline btn-xl">
              🎭 Join as Artist
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
