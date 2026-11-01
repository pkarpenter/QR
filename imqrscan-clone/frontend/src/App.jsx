import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Layout/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Links from './pages/Links'
import EditQR from './pages/EditQR'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import PublicRedirect from './pages/PublicRedirect'

function AppRoutes() {
  const { session, loading } = useAuth()

  // Handle public dynamic QR code scan redirect without requiring login
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/go/')) {
    return (
      <Routes>
        <Route path="/go/:slug" element={<PublicRedirect />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/qr" element={<Dashboard />} />
          <Route path="/qr/:id" element={<Links />} />
          <Route path="/qr/:id/edit" element={<EditQR />} />
          <Route path="/links" element={<Navigate to="/qr" replace />} />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/qr" replace />} />
        </Routes>
      </div>
    </div>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
