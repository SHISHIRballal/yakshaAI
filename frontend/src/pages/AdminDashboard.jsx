import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('analytics')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/users'),
    ]).then(([analyticsRes, usersRes]) => {
      setAnalytics(analyticsRes.data)
      setUsers(usersRes.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleUser = async (userId) => {
    const res = await api.put(`/admin/users/${userId}/toggle-active`)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, is_active: res.data.is_active } : usr))
  }

  const verifyArtist = async (artistId, userName) => {
    await api.put(`/admin/artists/${artistId}/verify`)
    setUsers(u => u.map(usr => usr.name === userName
      ? { ...usr, _artistVerified: !usr._artistVerified }
      : usr
    ))
    // Refresh analytics
    const res = await api.get('/admin/analytics')
    setAnalytics(res.data)
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page-enter">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: 'var(--space-3)' }}>
              👑
            </div>
            <div style={{ fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Platform Administrator</div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <span className="badge badge-red">Admin</span>
            </div>
          </div>

          <ul className="dashboard-nav">
            {[
              { id: 'analytics', icon: '📊', label: 'Analytics' },
              { id: 'users', icon: '👥', label: 'Manage Users' },
              { id: 'artists', icon: '🎭', label: 'Verify Artists' },
            ].map(item => (
              <li key={item.id}>
                <div className={`dashboard-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(196,30,58,0.1), rgba(212,175,55,0.05))', borderColor: 'rgba(196,30,58,0.3)' }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              Admin Dashboard 👑
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Manage the YakshaAI platform — verify artists, manage users, and track analytics.
            </p>
          </div>

          {/* ANALYTICS */}
          {activeSection === 'analytics' && analytics && (
            <>
              <div className="stats-grid">
                {[
                  { label: 'Total Users', value: analytics.total_users, icon: '👥' },
                  { label: 'Total Artists', value: analytics.total_artists, icon: '🎭' },
                  { label: 'Verified Artists', value: analytics.verified_artists, icon: '✓' },
                  { label: 'Organizers', value: analytics.total_organizers, icon: '📋' },
                  { label: 'Total Bookings', value: analytics.total_bookings, icon: '📅' },
                  { label: 'Reviews', value: analytics.total_reviews, icon: '⭐' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{s.icon}</div>
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Booking Status Chart */}
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Booking Status Overview</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                  {Object.entries(analytics.booking_status).map(([status, count]) => {
                    const colors = { pending: '#F39C12', confirmed: '#2ECC71', completed: '#3498DB', rejected: '#E74C3C' }
                    const total = Object.values(analytics.booking_status).reduce((a, b) => a + b, 0)
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={status} style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{
                            width: 60, height: 60, borderRadius: '50%', margin: '0 auto var(--space-2)',
                            background: `conic-gradient(${colors[status] || '#666'} ${pct * 3.6}deg, var(--color-surface-3) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%', background: 'var(--color-surface-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.875rem',
                              color: colors[status] || '#666',
                            }}>
                              {pct}%
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: colors[status] }}>{count}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{status}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* City & Style Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h2 className="dashboard-card-title">Artists by City</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {analytics.city_distribution.sort((a, b) => b.count - a.count).slice(0, 8).map(({ city, count }) => {
                      const max = analytics.city_distribution[0]?.count || 1
                      return (
                        <div key={city}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: '0.8rem' }}>
                            <span>{city}</span>
                            <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{count}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(count / analytics.city_distribution.reduce((a, b) => Math.max(a, b.count), 0)) * 100}%`,
                              background: 'linear-gradient(90deg, var(--color-gold-dark), var(--color-gold))',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h2 className="dashboard-card-title">Artists by Style</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {analytics.style_distribution.map(({ style, count }) => {
                      const styleColors = { 'Badagu Tittu': '#C41E3A', 'Tenkutittu': '#D4AF37', 'Both': '#FF6B35' }
                      const total = analytics.style_distribution.reduce((a, b) => a + b.count, 0)
                      return (
                        <div key={style} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: styleColors[style] || '#666', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: '0.8rem' }}>
                              <span>{style}</span>
                              <span style={{ fontWeight: 600 }}>{count} ({total > 0 ? Math.round(count / total * 100) : 0}%)</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${total > 0 ? (count / total) * 100 : 0}%`,
                                background: styleColors[style] || '#666', borderRadius: 'var(--radius-full)',
                              }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* USERS MANAGEMENT */}
          {activeSection === 'users' && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">User Management</h2>
                <span className="badge badge-neutral">{users.length} total</span>
              </div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <input type="text" className="form-input" placeholder="Search by name, email, or role..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'artist' ? 'badge-gold' : 'badge-neutral'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                            {u.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                              onClick={() => toggleUser(u.id)}>
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ARTIST VERIFICATION */}
          {activeSection === 'artists' && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Artist Verification</h2>
                <span className="badge badge-warning">
                  {analytics ? analytics.total_artists - analytics.verified_artists : 0} pending
                </span>
              </div>
              <ArtistVerificationList />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ArtistVerificationList() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/artists?limit=50').then(res => setArtists(res.data)).finally(() => setLoading(false))
  }, [])

  const toggle = async (artist) => {
    await api.put(`/admin/artists/${artist.id}/verify`)
    setArtists(a => a.map(ar => ar.id === artist.id ? { ...ar, is_verified: !ar.is_verified } : ar))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {artists.map(artist => (
        <div key={artist.id} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          padding: 'var(--space-4)', background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)', overflow: 'hidden',
            background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
          }}>
            {artist.profile_photo_url
              ? <img src={artist.profile_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : '🎭'}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700 }}>{artist.user_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {artist.performance_style} · {artist.specialization} · {artist.city} · {artist.experience_years} yrs
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className={`badge ${artist.is_verified ? 'badge-success' : 'badge-warning'}`}>
              {artist.is_verified ? '✓ Verified' : '⏳ Unverified'}
            </span>
            <button
              className={`btn btn-sm ${artist.is_verified ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => toggle(artist)}
            >
              {artist.is_verified ? 'Revoke' : 'Verify'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
