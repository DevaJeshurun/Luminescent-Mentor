import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useStore from './store/useStore'
import { authAPI } from './api'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Roadmap from './pages/Roadmap'
import Playground from './pages/Playground'
import Practice from './pages/Practice'
import Interview from './pages/Interview'
import Settings from './pages/Settings'

// ── Silent token bootstrap + proactive refresh ───────────────────────────────
function TokenKeepAlive() {
  const { setAuth, logout } = useStore()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // On every app load: verify the token is still valid
    authAPI.me()
      .then(res => {
        // Token is good — silently renew it so the clock resets
        return authAPI.refreshToken().then(r => {
          localStorage.setItem('token', r.data.token)
          setAuth(res.data, r.data.token)
        })
      })
      .catch(() => {
        // Token is truly expired → clear and let ProtectedLayout redirect
        logout()
      })

    // Proactively refresh every 6 days while the app is open
    // (token lasts 365 days so this is a very comfortable margin)
    const SIX_DAYS = 6 * 24 * 60 * 60 * 1000
    const timer = setInterval(async () => {
      try {
        const r = await authAPI.refreshToken()
        localStorage.setItem('token', r.data.token)
      } catch {
        // If refresh fails here the interceptor will handle it on next request
      }
    }, SIX_DAYS)

    return () => clearInterval(timer)
  }, []) // eslint-disable-line

  return null
}

function ProtectedLayout({ children, title, subtitle }) {
  const { token } = useStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenKeepAlive />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#161424', color: '#f0f0f8', border: '1px solid #2d2a3e' },
        success: { iconTheme: { primary: '#10b981', secondary: '#f0f0f8' } },
        error: { iconTheme: { primary: '#f97066', secondary: '#f0f0f8' } },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedLayout title="Dashboard"><Dashboard /></ProtectedLayout>} />
        <Route path="/chat" element={<ProtectedLayout title="AI Chat"><Chat /></ProtectedLayout>} />
        <Route path="/roadmap" element={<ProtectedLayout title="DSA Roadmap"><Roadmap /></ProtectedLayout>} />
        <Route path="/playground" element={<ProtectedLayout title="Playground"><Playground /></ProtectedLayout>} />
        <Route path="/practice" element={<ProtectedLayout title="Practice"><Practice /></ProtectedLayout>} />
        <Route path="/interview" element={<ProtectedLayout title="Mock Interview"><Interview /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout title="Settings"><Settings /></ProtectedLayout>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

