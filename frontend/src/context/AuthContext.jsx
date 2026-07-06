import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('yakshaai_token'))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      setToken(null)
      setUser(null)
      localStorage.removeItem('yakshaai_token')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('yakshaai_token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const register = async (name, email, password, role, phone) => {
    const res = await api.post('/auth/register', { name, email, password, role, phone })
    const { access_token, user: userData } = res.data
    localStorage.setItem('yakshaai_token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('yakshaai_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
