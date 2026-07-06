import React from 'react'

export default function LoadingSpinner({ fullPage = false, text = 'Loading...' }) {
  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--space-4)',
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{text}</p>
      </div>
    )
  }

  return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  )
}
