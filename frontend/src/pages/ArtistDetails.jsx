import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StarRating from '../components/StarRating'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function ArtistDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [artist, setArtist] = useState(null)
  const [reviews, setReviews] = useState([])
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    Promise.all([
      api.get(`/artists/${id}`),
      api.get(`/reviews/artist/${id}`),
      api.get(`/artists/${id}/availability`),
    ]).then(([artistRes, reviewsRes, availRes]) => {
      setArtist(artistRes.data)
      setReviews(reviewsRes.data)
      setAvailability(availRes.data)
    }).catch(() => navigate('/artists'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (!artist) return null

  const styleColors = {
    'Badagu Tittu': 'var(--color-primary-hover)',
    'Tenkutittu': 'var(--color-gold)',
    'Both': 'var(--color-saffron)',
  }

  const eventTypes = artist.event_types ? artist.event_types.split(',').map(e => e.trim()) : []
  const languages = artist.languages ? artist.languages.split(',').map(l => l.trim()) : []

  const getStatusColor = (status) => {
    if (status === 'available') return 'var(--color-success)'
    if (status === 'unavailable') return 'var(--color-error)'
    return 'var(--color-text-muted)'
  }

  return (
    <div className="page-enter">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(196,30,58,0.12) 0%, transparent 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-12) 0',
      }}>
        <div className="container">
          <Link to="/artists" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-6)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            ← Back to Artists
          </Link>
          <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
            {/* Photo */}
            <div style={{
              width: 160, height: 160, borderRadius: 'var(--radius-xl)',
              overflow: 'hidden', flexShrink: 0,
              border: '3px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '4rem',
            }}>
              {artist.profile_photo_url
                ? <img src={artist.profile_photo_url} alt={artist.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🎭'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{artist.user_name}</h1>
                {artist.is_verified && (
                  <span className="badge badge-success">✓ Verified Artist</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                <span style={{
                  padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700,
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${styleColors[artist.performance_style]}`,
                  color: styleColors[artist.performance_style],
                }}>
                  {artist.performance_style}
                </span>
                {artist.specialization && (
                  <span className="badge badge-gold">{artist.specialization}</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                <StarRating rating={artist.avg_rating} size="lg" showCount count={artist.total_reviews} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>📍 {artist.city}, Karnataka</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>🎪 {artist.experience_years} years</span>
              </div>

              <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-gold)', marginBottom: 'var(--space-5)' }}>
                ₹{artist.pricing_per_event?.toLocaleString('en-IN')}
                <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', fontWeight: 400 }}>/ event</span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                  <button className="btn btn-primary btn-lg" onClick={() => navigate(`/book/${id}`)}>
                    📋 Book This Artist
                  </button>
                )}
                {!user && (
                  <Link to="/auth" className="btn btn-primary btn-lg">
                    Sign In to Book
                  </Link>
                )}
                <button className="btn btn-outline btn-lg" onClick={() => navigator.share?.({ title: artist.user_name, url: window.location.href }) }>
                  🔗 Share Profile
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 180 }}>
              {[
                { label: 'Total Events', value: artist.total_bookings },
                { label: 'Happy Clients', value: artist.total_reviews },
                { label: 'Avg Rating', value: `${artist.avg_rating}★` },
                { label: 'Experience', value: `${artist.experience_years} yrs` },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                  <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>{s.value}</div>
                  <div className="stat-card-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0 }}>
            {['about', 'reviews', 'availability'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === tab ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--color-gold)' : '2px solid transparent',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.9rem',
                  textTransform: 'capitalize',
                  transition: 'all var(--transition-fast)',
                }}>
                {tab === 'about' ? 'About' : tab === 'reviews' ? `Reviews (${reviews.length})` : 'Availability'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-8)' }}>
            <div>
              {artist.bio && (
                <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>About the Artist</h3>
                  <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{artist.bio}</p>
                </div>
              )}

              <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', marginBottom: 'var(--space-5)' }}>Specializations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  {[
                    { label: 'Style', value: artist.performance_style },
                    { label: 'Specialization', value: artist.specialization || 'General' },
                    { label: 'Experience', value: `${artist.experience_years} years` },
                    { label: 'Languages', value: languages.join(', ') },
                    { label: 'Location', value: `${artist.city}, ${artist.state}` },
                    { label: 'Availability', value: artist.is_available ? 'Available' : 'Busy' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--space-1)' }}>{label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {eventTypes.length > 0 && (
                <div className="dashboard-card">
                  <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>Event Types</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {eventTypes.map(et => (
                      <span key={et} className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>{et}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="dashboard-card" style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>Quick Booking</h3>
                <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-gold)' }}>
                    ₹{artist.pricing_per_event?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>per event · 4-8 hours</div>
                </div>
                {user?.role === 'organizer' ? (
                  <button className="btn btn-primary w-full btn-lg" onClick={() => navigate(`/book/${id}`)}>
                    📋 Book Now
                  </button>
                ) : (
                  <Link to="/auth" className="btn btn-primary w-full btn-lg" style={{ textAlign: 'center' }}>
                    Sign In to Book
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div style={{ maxWidth: 720 }}>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>💬</div>
                <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {reviews.map(r => (
                  <div key={r.id} className="dashboard-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{r.organizer_name}</div>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    {r.comment && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === 'availability' && (
          <div style={{ maxWidth: 480 }}>
            <div className="dashboard-card">
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>
                Availability Calendar
              </h3>
              {availability.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Availability not set. Contact the artist directly to check dates.
                </p>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.8rem' }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(46,204,113,0.3)', border: '1px solid var(--color-success)', display: 'inline-block' }} />
                      Available
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.8rem' }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(231,76,60,0.3)', border: '1px solid var(--color-error)', display: 'inline-block' }} />
                      Unavailable
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {availability.slice(0, 20).map(slot => (
                      <div key={slot.date} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-surface-2)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${slot.is_available ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>{slot.date}</span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: slot.is_available ? 'var(--color-success)' : 'var(--color-error)',
                        }}>
                          {slot.is_available ? '✓ Available' : '✗ Booked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
