import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ReviewModal from '../components/ReviewModal'

const STATUS_COLORS = {
  pending:   { color: '#F39C12', bg: 'rgba(243,156,18,0.1)',  label: '⏳ Pending' },
  confirmed: { color: '#2ECC71', bg: 'rgba(46,204,113,0.1)',  label: '✓ Confirmed' },
  completed: { color: '#3498DB', bg: 'rgba(52,152,219,0.1)',  label: '✓ Completed' },
  rejected:  { color: '#E74C3C', bg: 'rgba(231,76,60,0.1)',   label: '✗ Rejected' },
  cancelled: { color: '#7F8C8D', bg: 'rgba(127,140,141,0.1)', label: '○ Cancelled' },
}

function isPastDate(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications } = useNotifications()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('bookings')
  const [reviewBooking, setReviewBooking] = useState(null)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [filterStatus, setFilterStatus] = useState('all')
  const [toast, setToast] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-refresh when artist responds to our booking
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (latest.type === 'booking_status_changed') {
        setRefreshKey(k => k + 1)
        showToast(`Artist ${latest.status}: ${latest.message?.split('.')[0]}`)
      }
    }
  }, [notifications])

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings')
      const sorted = res.data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      setBookings(sorted)

      // Find which completed bookings already have a review
      const reviewChecks = await Promise.allSettled(
        sorted
          .filter(b => b.status === 'completed')
          .map(b => api.get(`/reviews/booking/${b.id}`))
      )
      const reviewed = new Set()
      sorted
        .filter(b => b.status === 'completed')
        .forEach((b, i) => {
          if (reviewChecks[i].status === 'fulfilled' && reviewChecks[i].value.data?.id) {
            reviewed.add(b.id)
          }
        })
      setReviewedIds(reviewed)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBookings() }, [refreshKey])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const cancelBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled' })
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'cancelled' } : bk))
      showToast('Booking cancelled.')
    } catch {}
  }

  // Auto-mark confirmed past-date bookings as completed
  const markCompleted = async (id) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'completed' })
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'completed' } : bk))
      showToast('Booking marked as completed!')
    } catch {}
  }

  const handleReviewSubmitted = () => {
    setReviewedIds(prev => new Set([...prev, reviewBooking.id]))
    setBookings(b => b.map(bk => bk.id === reviewBooking.id ? { ...bk, status: 'completed' } : bk))
    setReviewBooking(null)
    showToast('✓ Review submitted! Thank you.')
  }

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus)

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }

  return (
    <div className="page-enter">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 999,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-gold)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-5)',
          color: 'var(--color-gold)',
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInRight 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: 'var(--space-3)' }}>
              👤
            </div>
            <div style={{ fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
            <div style={{ marginTop: 'var(--space-2)' }}><span className="badge badge-gold">Organizer</span></div>
          </div>

          <ul className="dashboard-nav">
            {[
              { id: 'bookings', icon: '📋', label: 'My Bookings', count: stats.pending },
              { id: 'find', icon: '🔍', label: 'Find Artists' },
              { id: 'ai', icon: '🤖', label: 'AI Recommendations' },
            ].map(item => (
              <li key={item.id}>
                <div
                  className={`dashboard-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => {
                    if (item.id === 'find') navigate('/artists')
                    else if (item.id === 'ai') navigate('/recommendations')
                    else setActiveSection(item.id)
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-full)', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {item.count}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Legend */}
          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-dim)', marginBottom: 'var(--space-3)' }}>How it works</div>
            {[
              { icon: '1', text: 'Submit booking request' },
              { icon: '2', text: 'Artist accepts/declines' },
              { icon: '3', text: 'Attend the event' },
              { icon: '4', text: 'Mark complete & review' },
            ].map(s => (
              <div key={s.icon} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--color-gold)', flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Welcome */}
          <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(196,30,58,0.1), rgba(212,175,55,0.05))', borderColor: 'rgba(212,175,55,0.2)' }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              Welcome back, {user?.name?.split(' ')[0]}! 🎭
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Manage your Yakshagana event bookings and leave reviews for completed performances.
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total Bookings', value: stats.total, icon: '📋' },
              { label: 'Awaiting Reply', value: stats.pending, icon: '⏳' },
              { label: 'Confirmed', value: stats.confirmed, icon: '✓' },
              { label: 'Completed', value: stats.completed, icon: '🎉' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{s.icon}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bookings Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">My Bookings</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter tabs */}
                <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 2, gap: 2 }}>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                        background: filterStatus === s ? 'var(--color-surface-3)' : 'none',
                        color: filterStatus === s ? 'var(--color-gold)' : 'var(--color-text-muted)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'capitalize',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/artists')}>
                  + New Booking
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
                <h3 style={{ fontFamily: 'var(--font-body)', marginBottom: 'var(--space-3)' }}>
                  {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
                  Browse our artists and book your first Yakshagana performance.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/artists')}>Browse Artists</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {filteredBookings.map(b => {
                  const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending
                  const isPast = isPastDate(b.event_date)
                  const canMarkComplete = b.status === 'confirmed' && isPast
                  const canReview = (b.status === 'completed') && !reviewedIds.has(b.id)
                  const alreadyReviewed = (b.status === 'completed') && reviewedIds.has(b.id)

                  return (
                    <div key={b.id} style={{
                      padding: 'var(--space-5)',
                      background: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${canReview ? 'rgba(212,175,55,0.3)' : 'var(--color-border)'}`,
                      transition: 'border-color 0.2s',
                    }}>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Artist Photo */}
                        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                          {b.artist_photo ? <img src={b.artist_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '🎭'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{b.artist_name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {b.event_type} · <strong>{b.event_date}</strong> {isPast && b.status !== 'completed' && b.status !== 'cancelled' && <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>(Past)</span>}
                              </div>
                            </div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                              color: st.color, background: st.bg, border: `1px solid ${st.color}30`,
                            }}>
                              {st.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                            <span>📍 {b.venue}</span>
                            <span>💰 ₹{b.budget?.toLocaleString('en-IN')}</span>
                            <span>⏱ {b.duration_hours}h</span>
                          </div>

                          {/* Artist response note */}
                          {b.artist_notes && (
                            <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(212,175,55,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.15)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                              💬 Artist: "{b.artist_notes}"
                            </div>
                          )}

                          {/* Already reviewed badge */}
                          {alreadyReviewed && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                              ⭐ Review submitted — thank you!
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 120 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/artists/${b.artist_id}`)}>
                            View Artist
                          </button>

                          {b.status === 'pending' && (
                            <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>
                              Cancel
                            </button>
                          )}

                          {/* Mark as Completed for past confirmed events */}
                          {canMarkComplete && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => markCompleted(b.id)}
                              title="Event date has passed — mark as completed"
                            >
                              ✓ Mark Complete
                            </button>
                          )}

                          {/* Leave Review for completed events */}
                          {canReview && (
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={() => setReviewBooking(b)}
                              style={{ animation: 'pulse 2s ease-in-out infinite' }}
                            >
                              ⭐ Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
