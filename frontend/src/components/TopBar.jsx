import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, HelpCircle, CheckCheck, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'

const SEARCH_TARGETS = [
  { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'overview'] },
  { label: 'AI Chat', path: '/chat', keywords: ['chat', 'ai', 'doubt', 'explain'] },
  { label: 'Coding Playground', path: '/playground', keywords: ['playground', 'compiler', 'run code', 'program'] },
  { label: 'DSA Practice', path: '/practice', keywords: ['practice', 'dsa', 'problems', 'question', 'programs'] },
  { label: 'Roadmap Generator', path: '/roadmap', keywords: ['roadmap', 'plan', 'learning path'] },
  { label: 'Mock Interview', path: '/interview', keywords: ['interview', 'mock', 'viva'] },
  { label: 'Settings / Profile', path: '/settings', keywords: ['settings', 'profile', 'account'] },
]

export default function TopBar({ title, subtitle }) {
  const { user, notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const unreadCount = useMemo(() => (notifications || []).filter(n => !n.read).length, [notifications])
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SEARCH_TARGETS.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.keywords.some(k => k.includes(q) || q.includes(k))
    ).slice(0, 6)
  }, [query])

  const runSearch = (q) => {
    const text = (q || '').trim()
    if (!text) return
    const exact = SEARCH_TARGETS.find(t =>
      t.label.toLowerCase() === text.toLowerCase() ||
      t.keywords.some(k => k === text.toLowerCase())
    )
    if (exact) {
      navigate(exact.path)
      setShowSearchResults(false)
      return
    }
    const first = searchResults[0]
    if (first) {
      navigate(first.path)
      setShowSearchResults(false)
      return
    }
    // Fallback: treat as programming/problem search query
    navigate(`/practice?q=${encodeURIComponent(text)}`)
    setShowSearchResults(false)
  }

  return (
    <header className="h-14 bg-dark-800/80 backdrop-blur border-b border-dark-300 flex items-center gap-4 px-5 shrink-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onFocus={() => setShowSearchResults(true)}
          onChange={e => { setQuery(e.target.value); setShowSearchResults(true) }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch(query)
            }
            if (e.key === 'Escape') setShowSearchResults(false)
          }}
          placeholder="Search algorithms, topics, or lessons..."
          className="w-full input-field pl-9 py-1.5 text-sm bg-dark-700/60"
        />
        {showSearchResults && query.trim() && (
          <div className="absolute left-0 right-0 mt-1 card p-1 z-30">
            {searchResults.length > 0 ? (
              searchResults.map(r => (
                <button
                  key={r.path}
                  onClick={() => { navigate(r.path); setShowSearchResults(false) }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="text-xs text-white">{r.label}</div>
                  <div className="text-[10px] text-gray-500">{r.path}</div>
                </button>
              ))
            ) : (
              <button
                onClick={() => runSearch(query)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <div className="text-xs text-white">Search in DSA Problems</div>
                <div className="text-[10px] text-gray-500">Press Enter to search "{query}"</div>
              </button>
            )}
          </div>
        )}
      </div>

      {title && (
        <div className="hidden md:block">
          <span className="text-white font-semibold text-sm">{title}</span>
          {subtitle && <span className="text-gray-500 text-xs ml-2">{subtitle}</span>}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button className="btn-icon" title="Help">
          <HelpCircle size={16} />
        </button>
        <div className="relative">
          <button className="btn-icon relative" title="Notifications" onClick={() => setShowNotifications(v => !v)}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-coral rounded-full"></span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 card p-0 overflow-hidden z-30">
              <div className="px-3 py-2 border-b border-dark-300 flex items-center justify-between">
                <span className="text-xs text-white font-semibold">Notifications</span>
                <div className="flex items-center gap-1">
                  <button onClick={markAllNotificationsRead} className="btn-icon p-1" title="Mark all as read"><CheckCheck size={13} /></button>
                  <button onClick={clearNotifications} className="btn-icon p-1" title="Clear all"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {!notifications?.length && (
                  <div className="px-3 py-4 text-xs text-gray-500">No notifications yet.</div>
                )}
                {notifications?.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left px-3 py-2 border-b border-dark-300/60 hover:bg-dark-700 transition-colors ${n.read ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-coral" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{n.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-amber flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>
    </header>
  )
}
