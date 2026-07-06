import React, { useState } from 'react'
import api from '../services/api'

export default function ReviewModal({ booking, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/reviews', {
        artist_id: booking.artist_id,
        booking_id: booking.id,
        rating,
        comment: comment.trim() || undefined,
      })
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review. You may have already reviewed this booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-xl)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              Rate Your Experience
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Reviewing <strong style={{ color: 'var(--color-gold)' }}>{booking.artist_name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: '1.25rem', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Event info */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-6)', fontSize: '0.8rem', color: 'var(--color-text-muted)',
          display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap',
        }}>
          <span>🎭 {booking.event_type}</span>
          <span>📅 {booking.event_date}</span>
          <span>📍 {booking.venue}</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Your Rating
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '2.5rem', lineHeight: 1,
                    color: star <= (hovered || rating) ? 'var(--color-gold)' : 'var(--color-border-light)',
                    transition: 'all 0.1s ease',
                    transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                    filter: star <= (hovered || rating) ? 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' : 'none',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <div style={{
                fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--color-gold)',
                transition: 'opacity 0.2s',
              }}>
                {labels[hovered || rating]}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">Your Review <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe the performance — costume quality, voice, punctuality, stage presence..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={600}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: 'var(--space-1)' }}>
              {comment.length}/600
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold btn-lg" style={{ flex: 2 }} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '⭐ Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
