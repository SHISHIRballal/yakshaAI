import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatbotWidget from './components/ChatbotWidget'
import Home from './pages/Home'
import Artists from './pages/Artists'
import ArtistDetails from './pages/ArtistDetails'
import Recommendations from './pages/Recommendations'
import Booking from './pages/Booking'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import ArtistDashboard from './pages/ArtistDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Contact from './pages/Contact'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/auth" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetails />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/book/:artistId" element={
            <ProtectedRoute allowedRoles={['organizer', 'artist']}>
              <Booking />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/artist/dashboard" element={
            <ProtectedRoute allowedRoles={['artist']}>
              <ArtistDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ChatbotWidget />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
