import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import VenueMapPicker from '../components/VenueMapPicker'

const EVENT_TYPES = [
  'Temple Festival', 'Wedding Ceremony', 'Cultural Program',
  'Corporate Event', 'College Event', 'Private Function',
  'National Competition', 'International Festival',
]

export default function Booking() {
  const { artistId } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()

  const [artist, setArtist]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')
  const [unavailDates, setUnavailDates] = useState(new Set()) // Set of 'YYYY-MM-DD' strings
  const [dateWarning, setDateWarning]   = useState('')
  const [mapMode, setMapMode]           = useState(true)

  const [form, setForm] = useState({
    event_date: '',
    event_type: '',
    venue: '',
    venue_city: '',
    venue_map_link: '',
    budget: '',
    duration_hours: 4,
    special_requirements: '',
    organizer_notes: '',
  })

  // Callback when user selects location on map
  const handleLocationSelect = ({ venue, venue_city, venue_map_link }) => {
    setForm(f => ({ ...f, venue, venue_city, venue_map_link }))
  }

  // Fetch artist + unavailable dates
  useEffect(() => {
    Promise.all([
      api.get(`/artists/${artistId}`),
      api.get(`/artists/${artistId}/availability`),
    ])
      .then(([artistRes, availRes]) => {
        setArtist(artistRes.data)
        setForm(f => ({ ...f, budget: artistRes.data.pricing_per_event }))

        // Build set of unavailable date strings
        const blocked = new Set(
          (availRes.data || [])
            .filter(d => d.is_available === false)
            .map(d => d.date)
        )
        setUnavailDates(blocked)
      })
      .catch(() => navigate('/artists'))
      .finally(() => setLoading(false))
  }, [artistId])

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleDateChange = (value) => {
    handleChange('event_date', value)
    if (unavailDates.has(value)) {
      setDateWarning(`⚠️ Artist has marked ${value} as unavailable. Please choose a different date.`)
    } else {
      setDateWarning('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.event_date || !form.event_type || !form.venue || !form.budget) {
      setError('Please fill in all required fields.')
      return
    }
    if (unavailDates.has(form.event_date)) {
      setError(`Artist is not available on ${form.event_date}. Please select a different date.`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/bookings', {
        ...form,
        artist_id: Number(artistId),
        budget: Number(form.budget),
        duration_hours: Number(form.duration_hours),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-6)', animation: 'float 2s ease-in-out infinite' }}>🎉</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Booking Request Sent!</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: 440, marginBottom: 'var(--space-4)' }}>
          Your booking request for <strong>{artist?.user_name}</strong> has been submitted.
          The artist will review and confirm within 24 hours.
        </p>
        {form.venue_map_link && (
          <a
            href={form.venue_map_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-6)', color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}
          >
            📍 View venue on map →
          </a>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>View My Bookings</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/artists')}>Browse More Artists</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            ← Back
          </button>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Book Artist</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Fill in the details for your event</p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)', alignItems: 'start' }}>

          {/* Booking Form */}
          <form onSubmit={handleSubmit}>

            {/* ── Event Details ── */}
            <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Event Details</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {/* Date picker — disabled if unavailable */}
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.event_date}
                    onChange={e => handleDateChange(e.target.value)}
                    style={unavailDates.has(form.event_date) ? { borderColor: 'var(--color-danger)', boxShadow: '0 0 0 2px rgba(231,76,60,0.2)' } : {}}
                  />
                  {dateWarning && (
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: 4 }}>{dateWarning}</p>
                  )}
                  {unavailDates.size > 0 && (
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.72rem', marginTop: 3 }}>
                      🚫 {unavailDates.size} date(s) blocked by artist
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                  <select className="form-select" required value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                    <option value="">Select type...</option>
                    {EVENT_TYPES.map(et => <option key={et}>{et}</option>)}
                  </select>
                </div>

                {/* Unavailable dates legend */}
                {unavailDates.size > 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: 'var(--space-3) var(--space-4)', background: 'rgba(231,76,60,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(231,76,60,0.2)', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--color-danger)' }}>🚫 Artist Unavailable Dates:</strong>{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {[...unavailDates].sort().slice(0, 8).join(', ')}{unavailDates.size > 8 ? ` +${unavailDates.size - 8} more` : ''}
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Duration (hours)</label>
                  <select className="form-select" value={form.duration_hours} onChange={e => handleChange('duration_hours', Number(e.target.value))}>
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(h => <option key={h} value={h}>{h} hours</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Venue / Location ── */}
            <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">📍 Venue Location</h2>
                <button
                  type="button"
                  className={`btn btn-sm ${mapMode ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setMapMode(m => !m)}
                >
                  {mapMode ? '🗺️ Interactive Map Active' : '🗺️ Open Map Picker'}
                </button>
              </div>

              {/* MAP MODE */}
              {mapMode && (
                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <VenueMapPicker
                    selectedVenue={form.venue}
                    selectedCity={form.venue_city}
                    mapLink={form.venue_map_link}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Venue Name &amp; Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={mapMode ? 'Auto-filled when you click the map…' : 'e.g., Sri Krishna Temple, MG Road'}
                    value={form.venue}
                    onChange={e => handleChange('venue', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Udupi"
                    value={form.venue_city}
                    onChange={e => handleChange('venue_city', e.target.value)}
                  />
                </div>
                {/* Manual map link */}
                {!mapMode && (
                  <div className="form-group">
                    <label className="form-label">Map Link <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span></label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Paste Google Maps or OSM link"
                      value={form.venue_map_link}
                      onChange={e => handleChange('venue_map_link', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Budget & Notes ── */}
            <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Budget &amp; Notes</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Your Budget (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min={1000}
                    placeholder="e.g., 25000"
                    value={form.budget}
                    onChange={e => handleChange('budget', e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                    Artist fee: ₹{artist?.pricing_per_event?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Budget Status</label>
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    color: Number(form.budget) >= artist?.pricing_per_event
                      ? 'var(--color-success)' : 'var(--color-warning)',
                  }}>
                    {Number(form.budget) >= artist?.pricing_per_event
                      ? '✓ Sufficient for artist fee'
                      : '⚠ Below artist standard rate'}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Special Requirements</label>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Costume preferences, specific compositions, language requirements, etc."
                    value={form.special_requirements}
                    onChange={e => handleChange('special_requirements', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Message to Artist</label>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Introduce yourself and your event..."
                    value={form.organizer_notes}
                    onChange={e => handleChange('organizer_notes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-xl w-full"
              disabled={submitting || unavailDates.has(form.event_date)}
            >
              {submitting ? '⏳ Submitting...' : '📋 Submit Booking Request'}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: 'var(--space-3)' }}>
              The artist will review and confirm your request within 24 hours.
            </p>
          </form>

          {/* Artist Summary Sidebar */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div className="dashboard-card">
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>
                Artist Summary
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                  {artist?.profile_photo_url
                    ? <img src={artist.profile_photo_url} alt={artist.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🎭'}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{artist?.user_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>{artist?.specialization}</div>
                  {artist?.is_verified && <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Verified</div>}
                </div>
              </div>

              {[
                { label: 'Performance Style', value: artist?.performance_style },
                { label: 'Experience', value: `${artist?.experience_years} years` },
                { label: 'Location', value: `${artist?.city}, Karnataka` },
                { label: 'Rating', value: artist?.total_reviews > 0 ? `⭐ ${artist?.avg_rating?.toFixed(1)} (${artist?.total_reviews} reviews)` : 'No reviews yet' },
                { label: 'Standard Fee', value: `₹${artist?.pricing_per_event?.toLocaleString('en-IN')}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: 160 }}>{value}</span>
                </div>
              ))}

              {/* Unavailable dates count */}
              {unavailDates.size > 0 && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(231,76,60,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(231,76,60,0.2)', fontSize: '0.78rem', color: 'var(--color-danger)', textAlign: 'center' }}>
                  🚫 {unavailDates.size} blocked date(s) — artist unavailable
                </div>
              )}

              <div className="divider divider-gold" />

              <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(212,175,55,0.05)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginBottom: 'var(--space-1)' }}>Your Booking</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-gold)' }}>
                  ₹{Number(form.budget || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
