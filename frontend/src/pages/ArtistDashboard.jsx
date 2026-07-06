import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_COLORS = {
  pending:   { color: 'var(--color-warning)', label: '⏳ Pending' },
  confirmed: { color: 'var(--color-success)', label: '✓ Confirmed' },
  completed: { color: 'var(--color-info)',    label: '✓ Completed' },
  rejected:  { color: 'var(--color-error)',   label: '✗ Rejected' },
  cancelled: { color: 'var(--color-text-muted)', label: '○ Cancelled' },
}

function isPastDate(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

const CITIES = ['Udupi', 'Mangaluru', 'Dharwad', 'Bengaluru', 'Kundapur', 'Karwar', 'Sirsi', 'Honavar', 'Mysuru', 'Hubli']

export default function ArtistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications } = useNotifications()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('bookings')
  const [profileForm, setProfileForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-refresh bookings on any incoming notification
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (latest.type === 'booking_status_changed' || latest.type === 'new_booking') {
        setRefreshKey(k => k + 1)
      }
    }
  }, [notifications])

  useEffect(() => {
    Promise.all([
      api.get('/auth/me').then(async res => {
        const artist = await api.get(`/artists?limit=1&search=${encodeURIComponent(res.data.name)}`)
        return artist.data[0] || null
      }),
      api.get('/bookings'),
    ]).then(([artistProfile, bookingsRes]) => {
      setProfile(artistProfile)
      if (artistProfile) {
        setProfileForm({
          bio: artistProfile.bio || '',
          performance_style: artistProfile.performance_style || 'Badagu Tittu',
          specialization: artistProfile.specialization || '',
          experience_years: artistProfile.experience_years || 0,
          city: artistProfile.city || '',
          pricing_per_event: artistProfile.pricing_per_event || 10000,
          languages: artistProfile.languages || 'Kannada',
          event_types: artistProfile.event_types || '',
          is_available: artistProfile.is_available !== false,
        })
      }
      setBookings(bookingsRes.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await api.put(`/artists/${profile.id}`, {
        ...profileForm,
        experience_years: Number(profileForm.experience_years),
        pricing_per_event: Number(profileForm.pricing_per_event),
      })
      setProfile({ ...profile, ...res.data })
      setSaveMsg('Profile updated successfully!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const respondToBooking = async (bookingId, status, notes = '') => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status, artist_notes: notes || undefined })
      setBookings(b => b.map(bk => bk.id === bookingId ? { ...bk, status, artist_notes: notes } : bk))
    } catch {}
  }

  const markCompleted = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'completed' })
      setBookings(b => b.map(bk => bk.id === bookingId ? { ...bk, status: 'completed' } : bk))
    } catch {}
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    earnings: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.budget, 0),
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page-enter">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface-2)', fontSize: '1.75rem', marginBottom: 'var(--space-3)',
            }}>
              {profile?.profile_photo_url
                ? <img src={profile.profile_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : '🎭'}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{user?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)', marginBottom: 'var(--space-2)' }}>
              {profile?.specialization || 'Yakshagana Artist'}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="badge badge-gold">Artist</span>
              {profile?.is_verified && <span className="badge badge-success">Verified</span>}
            </div>
          </div>

          <ul className="dashboard-nav">
            {[
              { id: 'bookings', icon: '📋', label: 'Booking Requests' },
              { id: 'profile', icon: '🎭', label: 'My Profile' },
              { id: 'availability', icon: '📅', label: 'Availability' },
            ].map(item => (
              <li key={item.id}>
                <div className={`dashboard-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'bookings' && stats.pending > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: 'var(--color-primary)', color: 'white',
                      borderRadius: 'var(--radius-full)', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                    }}>{stats.pending}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Welcome */}
          <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(196,30,58,0.06))', borderColor: 'rgba(212,175,55,0.2)' }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              Welcome, {user?.name?.split(' ')[0]}! 🎭
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Manage your bookings, update your profile, and set your availability.
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total Bookings', value: stats.total, icon: '📋' },
              { label: 'Pending Requests', value: stats.pending, icon: '⏳' },
              { label: 'Confirmed', value: stats.confirmed, icon: '✓' },
              { label: 'Total Earnings', value: `₹${stats.earnings.toLocaleString('en-IN')}`, icon: '💰' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{s.icon}</div>
                <div className="stat-card-value" style={{ fontSize: typeof s.value === 'string' ? '1.25rem' : '1.75rem' }}>{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* BOOKINGS SECTION */}
          {activeSection === 'bookings' && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Booking Requests</h2>
                {stats.pending > 0 && <span className="badge badge-warning">{stats.pending} pending</span>}
              </div>

              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
                  <p style={{ color: 'var(--color-text-muted)' }}>No booking requests yet. Complete your profile to get discovered!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {bookings.map(b => {
                    const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending
                    return (
                      <div key={b.id} style={{
                        padding: 'var(--space-5)', background: 'var(--color-surface-2)',
                        borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{b.organizer_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {b.event_type} · <strong>{b.event_date}</strong>{isPastDate(b.event_date) && b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected' && <span style={{ color: 'var(--color-warning)', fontWeight: 600, marginLeft: 4 }}>(Past event)</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color }}>{st.label}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                          <span>📍 {b.venue}, {b.venue_city}</span>
                          <span>💰 Offered: ₹{b.budget?.toLocaleString('en-IN')}</span>
                        </div>

                        {b.organizer_notes && (
                          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                            📝 "{b.organizer_notes}"
                          </div>
                        )}

                        {b.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button className="btn btn-primary btn-sm"
                              onClick={() => respondToBooking(b.id, 'confirmed', 'Thank you! I confirm this booking.')}>
                              ✓ Accept
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => respondToBooking(b.id, 'rejected', 'Sorry, I am unavailable on this date.')}>
                              ✗ Decline
                            </button>
                          </div>
                        )}
                        {b.status === 'confirmed' && isPastDate(b.event_date) && (
                          <button className="btn btn-primary btn-sm" onClick={() => markCompleted(b.id)}>
                            ✓ Mark as Completed
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Edit Profile</h2>
              </div>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Performance Style</label>
                    <select className="form-select" value={profileForm.performance_style} onChange={e => setProfileForm(f => ({ ...f, performance_style: e.target.value }))}>
                      <option value="Badagu Tittu">Badagu Tittu</option>
                      <option value="Tenkutittu">Tenkutittu</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <select className="form-select" value={profileForm.specialization} onChange={e => setProfileForm(f => ({ ...f, specialization: e.target.value }))}>
                      <option value="">Select...</option>
                      {['Bhagavata', 'Veshadhara', 'Chande', 'Maddale', 'Odeyata'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (years)</label>
                    <input type="number" className="form-input" min={0} max={60}
                      value={profileForm.experience_years} onChange={e => setProfileForm(f => ({ ...f, experience_years: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <select className="form-select" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}>
                      <option value="">Select city...</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pricing per Event (₹)</label>
                    <input type="number" className="form-input" min={1000}
                      value={profileForm.pricing_per_event} onChange={e => setProfileForm(f => ({ ...f, pricing_per_event: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Languages</label>
                    <input type="text" className="form-input" placeholder="e.g., Kannada, Tulu"
                      value={profileForm.languages} onChange={e => setProfileForm(f => ({ ...f, languages: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows={4} placeholder="Tell organizers about yourself..."
                    value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Event Types (comma separated)</label>
                  <input type="text" className="form-input" placeholder="Temple Festival, Wedding, Cultural Program"
                    value={profileForm.event_types} onChange={e => setProfileForm(f => ({ ...f, event_types: e.target.value }))} />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={profileForm.is_available} onChange={e => setProfileForm(f => ({ ...f, is_available: e.target.checked }))}
                      style={{ accentColor: 'var(--color-gold)', width: 16, height: 16 }} />
                    <span>Available for bookings</span>
                  </label>
                </div>

                {saveMsg && (
                  <div className={`alert ${saveMsg.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 'var(--space-4)' }}>
                    {saveMsg}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* AVAILABILITY SECTION */}
          {activeSection === 'availability' && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Manage Availability</h2>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
                Mark dates when you are NOT available. Organizers can see your calendar when booking.
              </p>
              {profile ? (
                <AvailabilityManager artistId={profile.id} />
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>Profile not found. Please contact support.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AvailabilityManager({ artistId }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [availability, setAvailability] = useState({})
  const [saving, setSaving] = useState(false)

  const monthKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`

  useEffect(() => {
    api.get(`/artists/${artistId}/availability?month=${monthKey}`)
      .then(res => {
        const map = {}
        res.data.forEach(s => { map[s.date] = s.is_available })
        setAvailability(map)
      }).catch(() => {})
  }, [artistId, monthKey])

  const toggleDate = (dateStr) => {
    setAvailability(prev => ({
      ...prev,
      [dateStr]: prev[dateStr] === false ? true : false,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const dates = Object.entries(availability).map(([date, is_available]) => ({ date, is_available }))
    await api.put(`/artists/${artistId}/availability`, dates)
    setSaving(false)
  }

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate()
  const firstDay = new Date(currentMonth.year, currentMonth.month, 1).getDay()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const d = new Date(currentMonth.year, currentMonth.month - 1)
          setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
        }}>← Prev</button>
        <span style={{ fontWeight: 600 }}>{monthNames[currentMonth.month]} {currentMonth.year}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const d = new Date(currentMonth.year, currentMonth.month + 1)
          setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
        }}>Next →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: 'var(--space-2)', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isUnavailable = availability[dateStr] === false
          return (
            <div key={day}
              onClick={() => toggleDate(dateStr)}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer',
                background: isUnavailable ? 'rgba(231,76,60,0.2)' : 'var(--color-surface-2)',
                border: isUnavailable ? '1px solid rgba(231,76,60,0.4)' : '1px solid var(--color-border)',
                color: isUnavailable ? 'var(--color-error)' : 'var(--color-text)',
                transition: 'all var(--transition-fast)',
              }}>
              {day}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.8rem' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />
          Available (default)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.8rem' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)' }} />
          Unavailable (click to mark)
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? '⏳ Saving...' : '💾 Save Availability'}
      </button>
    </div>
  )
}
