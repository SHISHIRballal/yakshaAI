import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT = 5

  const addNotification = useCallback((notif) => {
    const entry = { ...notif, id: Date.now(), read: false, receivedAt: new Date() }
    setNotifications(prev => [entry, ...prev].slice(0, 50)) // keep last 50
    setUnreadCount(c => c + 1)
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const connect = useCallback(() => {
    if (!user || !token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    // In production: VITE_WS_URL = wss://your-render-app.onrender.com
    // In dev: derived from current page (localhost:8000 via same origin logic)
    const wsBase = import.meta.env.VITE_WS_URL ||
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://127.0.0.1:8000`
    const url = `${wsBase}/ws/notifications/${user.id}?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      reconnectAttempts.current = 0
      console.log('[WS] Connected to notification stream')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'connected') return // ignore handshake
        addNotification(data)
      } catch {}
    }

    ws.onclose = (e) => {
      setIsConnected(false)
      wsRef.current = null
      // Reconnect with exponential backoff (only if user still logged in)
      if (user && reconnectAttempts.current < MAX_RECONNECT) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
        reconnectAttempts.current += 1
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    // Heartbeat ping every 25s to keep connection alive through proxies
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 25000)

    ws._pingInterval = pingInterval
  }, [user, token, addNotification])

  useEffect(() => {
    if (user && token) {
      connect()
    } else {
      // Logged out — close connection
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval)
        wsRef.current.close()
        wsRef.current = null
      }
      clearTimeout(reconnectTimer.current)
      reconnectAttempts.current = 0
      setIsConnected(false)
      setNotifications([])
      setUnreadCount(0)
    }

    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval)
        wsRef.current.close()
      }
    }
  }, [user?.id, token])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      markAllRead,
      clearAll,
      addNotification, // allow manual injection for testing
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
