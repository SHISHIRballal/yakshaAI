import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import ArtistCard from '../components/ArtistCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CITIES = ['Udupi', 'Mangaluru', 'Dharwad', 'Bengaluru', 'Kundapur', 'Karwar', 'Sirsi', 'Honavar', 'Mysuru', 'Hubli']
const EVENT_TYPES = ['Temple Festival', 'Wedding Ceremony', 'Cultural Program', 'Corporate Event', 'College Event', 'National Competition', 'International Festival']

export default function Recommendations() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    budget: 20000,
    city: '',
    event_type: '',
    performance_style: '',
    min_experience: 0,
    min_rating: 0,
    limit: 6,
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        budget: Number(form.budget),
        limit: form.limit,
        min_experience: Number(form.min_experience),
        min_rating: Number(form.min_rating),
      }
      if (form.city) payload.city = form.city
      if (form.event_type) payload.event_type = form.event_type
      if (form.performance_style) payload.performance_style = form.performance_style
      const res = await api.post('/recommendations', payload)
      setResults(res.data)
      setSearched(true)
    } catch {
      setError('Failed to get recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (score) => {
    if (score >= 80) return 'var(--color-success)'
    if (score >= 60) return 'var(--color-gold)'
    if (score >= 40) return 'var(--color-saffron)'
    return 'var(--color-text-muted)'
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(196,30,58,0.1), rgba(212,175,55,0.08))',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-12) 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🤖</div>
          <div className="section-subtitle">AI-Powered</div>
          <h1 style={{ marginBottom: 'var(--space-3)' }}>
            Smart Artist <span className="gradient-text">Recommendations</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto', fontSize: '1.05rem' }}>
            Tell us about your event and our AI will find the best Yakshagana artists for you — 
            ranked by compatibility score.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          {/* Form */}
          <div style={{ position: 'sticky', top: 88 }}>
            <form onSubmit={handleSubmit} className="dashboard-card">
              <div style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                  Your Event Preferences
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  Fill in as much as you know
                </p>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">Budget for Artist</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold)', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                    ₹ {Number(form.budget).toLocaleString('en-IN')}
                  </span>
                </div>
                <input type="range" min={5000} max={60000} step={1000}
                  value={form.budget} onChange={e => handleChange('budget', e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                  <span>₹5,000</span><span>₹60,000</span>
                </div>
              </div>

              {/* City */}
              <div className="form-group">
                <label className="form-label">Event Location (City)</label>
                <select className="form-select" value={form.city} onChange={e => handleChange('city', e.target.value)}>
                  <option value="">Any City</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Event Type */}
              <div className="form-group">
                <label className="form-label">Event Type</label>
                <select className="form-select" value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                  <option value="">Any Event Type</option>
                  {EVENT_TYPES.map(et => <option key={et}>{et}</option>)}
                </select>
              </div>

              {/* Style */}
              <div className="form-group">
                <label className="form-label">Preferred Style</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {['', 'Badagu Tittu', 'Tenkutittu', 'Both'].map(s => (
                    <button key={s} type="button"
                      onClick={() => handleChange('performance_style', s)}
                      className={`btn btn-sm ${form.performance_style === s ? 'btn-gold' : 'btn-ghost'}`}>
                      {s || 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Experience */}
              <div className="form-group">
                <label className="form-label">Min. Experience (years): {form.min_experience}+</label>
                <input type="range" min={0} max={30} step={2}
                  value={form.min_experience} onChange={e => handleChange('min_experience', e.target.value)} />
              </div>

              {/* Min Rating */}
              <div className="form-group">
                <label className="form-label">Minimum Rating</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[0, 3.5, 4, 4.5].map(r => (
                    <button key={r} type="button"
                      onClick={() => handleChange('min_rating', r)}
                      className={`btn btn-sm ${form.min_rating === r ? 'btn-gold' : 'btn-ghost'}`}>
                      {r === 0 ? 'Any' : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results count */}
              <div className="form-group">
                <label className="form-label">Number of Results</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[3, 6, 9, 12].map(n => (
                    <button key={n} type="button"
                      onClick={() => handleChange('limit', n)}
                      className={`btn btn-sm ${form.limit === n ? 'btn-gold' : 'btn-ghost'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? '🔄 Analyzing...' : '🤖 Find My Artists'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div>
            {loading && <LoadingSpinner fullPage text="AI is finding your best matches..." />}

            {!loading && !searched && (
              <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', opacity: 0.4 }}>🎭</div>
                <h3 style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
                  Fill the form and let AI work its magic
                </h3>
                <p style={{ color: 'var(--color-text-dim)', marginTop: 'var(--space-2)' }}>
                  Our recommendation engine analyzes 5 factors to match you with the perfect artist.
                </p>
              </div>
            )}

            {!loading && results && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {results.total} Artists Matched
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      Sorted by AI compatibility score
                    </p>
                  </div>
                </div>

                {results.artists.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>🔍</div>
                    <h3 style={{ fontFamily: 'var(--font-body)', marginBottom: 'var(--space-3)' }}>No matches found</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Try relaxing your filters, especially budget or experience.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {results.artists.map((artist, index) => (
                      <div key={artist.id} className="dashboard-card"
                        style={{ border: index === 0 ? '1px solid rgba(212,175,55,0.4)' : undefined, cursor: 'pointer' }}
                        onClick={() => navigate(`/artists/${artist.id}`)}>
                        {index === 0 && (
                          <div style={{ marginBottom: 'var(--space-3)' }}>
                            <span className="badge badge-gold">🏆 Best Match</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          {/* Photo */}
                          <div style={{
                            width: 72, height: 72, borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-2)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                            flexShrink: 0,
                          }}>
                            {artist.profile_photo_url
                              ? <img src={artist.profile_photo_url} alt={artist.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : '🎭'}
                          </div>

                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700 }}>
                                {artist.user_name}
                                {artist.is_verified && <span style={{ marginLeft: 'var(--space-2)', fontSize: '0.7rem', color: 'var(--color-success)' }}>✓</span>}
                              </h3>
                              <div className="match-score" style={{ color: getMatchColor(artist.match_score) }}>
                                🎯 {artist.match_score}% match
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              <span>🎭 {artist.performance_style}</span>
                              <span>📍 {artist.city}</span>
                              <span>⭐ {artist.avg_rating}</span>
                              <span>🎪 {artist.experience_years} yrs</span>
                              <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                                ₹{artist.pricing_per_event?.toLocaleString('en-IN')}
                              </span>
                            </div>

                            {/* Match reasons */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              {artist.match_reasons.map((reason, i) => (
                                <span key={i} style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(212,175,55,0.08)',
                                  border: '1px solid rgba(212,175,55,0.2)',
                                  color: 'var(--color-text-muted)',
                                }}>
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/book/${artist.id}`) }}>
                              Book
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); navigate(`/artists/${artist.id}`) }}>
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
