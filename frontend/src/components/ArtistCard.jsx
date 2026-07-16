import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ArtistCard({ artist }) {
  const navigate = useNavigate()

  const stars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? '' : 'star-empty'}>★</span>
    ))
  }

  const styleColors = {
    'Badagu Tittu': 'var(--color-primary-hover)',
    'Tenkutittu': 'var(--color-gold)',
    'Both': 'var(--color-saffron)',
  }

  return (
    <div className="artist-card" onClick={() => navigate(`/artists/${artist.id}`)}>
      {/* Photo */}
      <div className="artist-card-photo">
        {artist.profile_photo_url ? (
          <img src={artist.profile_photo_url} alt={artist.user_name} loading="lazy" />
        ) : (
          <span>🎭</span>
        )}
      </div>

      {/* Verified Badge */}
      {artist.is_verified && (
        <div className="verified-badge">✓ Verified</div>
      )}

      <div className="artist-card-body">
        <div className="artist-card-top">
          <div>
            <div className="artist-card-name">{artist.user_name || 'Artist'}</div>
            <div className="artist-card-specialty">{artist.specialization}</div>
          </div>
          <div className="stars" style={{ fontSize: '0.85rem' }}>
            {artist.total_reviews > 0 ? stars(artist.avg_rating) : <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>New</span>}
          </div>
        </div>

        {/* Style badge */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${styleColors[artist.performance_style] || 'var(--color-border)'}`,
            color: styleColors[artist.performance_style] || 'var(--color-text-muted)',
          }}>
            {artist.performance_style}
          </span>
        </div>

        <div className="artist-card-meta">
          <div className="artist-card-meta-item">
            <span className="icon">📍</span>
            <span>{artist.city}, Karnataka</span>
          </div>
          <div className="artist-card-meta-item">
            <span className="icon">🎪</span>
            <span>{artist.experience_years} years experience</span>
          </div>
          <div className="artist-card-meta-item">
            <span className="icon">⭐</span>
            <span>
              {artist.total_reviews > 0
                ? `${artist.avg_rating.toFixed(1)} (${artist.total_reviews} reviews)`
                : 'No reviews yet'}
            </span>
          </div>
        </div>

        <div className="artist-card-footer">
          <div>
            <div className="artist-card-price">
              ₹{artist.pricing_per_event?.toLocaleString('en-IN')}
              <span> / event</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/book/${artist.id}`)
            }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  )
}
