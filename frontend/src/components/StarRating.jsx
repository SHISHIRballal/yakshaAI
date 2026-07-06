import React from 'react'

export default function StarRating({ rating, size = 'md', showCount = false, count = 0 }) {
  const sizes = { sm: '0.75rem', md: '0.9rem', lg: '1.1rem', xl: '1.4rem' }
  const fontSize = sizes[size] || sizes.md

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <div className="stars" style={{ fontSize }}>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < Math.floor(rating)
          const half = !filled && i < rating
          return (
            <span key={i} style={{ color: filled || half ? 'var(--color-gold)' : 'var(--color-border-light)' }}>
              {half ? '½' : '★'}
            </span>
          )
        })}
      </div>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          ({count})
        </span>
      )}
    </div>
  )
}
