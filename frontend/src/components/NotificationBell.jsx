import React, { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

const TYPE_ICON = {
  new_booking: '📋',
  booking_status_changed: '🔔',
  default: '🔔',
}

const STATUS_COLOR = {
  confirmed: '#2ECC71',
  rejected: '#E74C3C',
  cancelled: '#7F8C8D',
  completed: '#3498DB',
}

function timeAgo(date) {
  const secs = Math.floor((new Date() - new Date(date)) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function NotificationBell() {
  const { notifications, unreadCount, isConnected, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open && unreadCount > 0) markAllRead()
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          background: open ? 'var(--color-surface-2)' : 'none',
          border: '1px solid ' + (open ? 'var(--color-border)' : 'transparent'),
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '1.1rem',
          transition: 'all var(--transition-fast)',
          color: 'var(--color-text-muted)',
        }}
        title={isConnected ? 'Notifications (live)' : 'Notifications (offline)'}
      >
        {unreadCount > 0
          ? <span style={{ animation: 'bellRing 0.6s ease infinite alternate' }}>🔔</span>
          : <span>🔕</span>
        }

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2, right: 2,
            minWidth: 16, height: 16,
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.6rem',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            boxShadow: '0 0 0 2px var(--color-bg)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Live indicator dot */}
        <span style={{
          position: 'absolute',
          bottom: 3, right: 3,
          width: 6, height: 6,
          borderRadius: '50%',
          background: isConnected ? 'var(--color-success)' : 'var(--color-text-dim)',
          boxShadow: isConnected ? '0 0 6px var(--color-success)' : 'none',
        }} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 360,
          maxHeight: 480,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
              {isConnected
                ? <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 600 }}>● LIVE</span>
                : <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>○ offline</span>
              }
            </div>
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-dim)', fontSize: '0.75rem',
              }}>
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔕</div>
                <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 'var(--space-1)' }}>
                  {isConnected ? 'You\'re connected — updates will appear here' : 'Connect to receive live updates'}
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--color-border)',
                  background: n.read ? 'transparent' : 'rgba(212,175,55,0.04)',
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-2)',
                    border: `1px solid ${STATUS_COLOR[n.status] || 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', flexShrink: 0,
                  }}>
                    {TYPE_ICON[n.type] || TYPE_ICON.default}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '2px', color: n.read ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                      {timeAgo(n.receivedAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-gold)', marginTop: 4, flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
