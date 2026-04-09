import { create } from 'zustand'

const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Chat sessions
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),

  // Theme / UI
  activeMode: 'JAVA_TUTOR',
  setActiveMode: (mode) => set({ activeMode: mode }),

  // Notifications
  notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
  addNotification: (payload) => {
    const current = get().notifications || []
    const next = [
      {
        id: Date.now(),
        title: payload?.title || 'New notification',
        message: payload?.message || '',
        type: payload?.type || 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current
    ].slice(0, 30)
    localStorage.setItem('notifications', JSON.stringify(next))
    set({ notifications: next })
  },
  markNotificationRead: (id) => {
    const next = (get().notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
    localStorage.setItem('notifications', JSON.stringify(next))
    set({ notifications: next })
  },
  markAllNotificationsRead: () => {
    const next = (get().notifications || []).map(n => ({ ...n, read: true }))
    localStorage.setItem('notifications', JSON.stringify(next))
    set({ notifications: next })
  },
  clearNotifications: () => {
    localStorage.removeItem('notifications')
    set({ notifications: [] })
  },

  // Personal profile details (user-editable)
  profileDetails: JSON.parse(localStorage.getItem('profileDetails') || 'null') || {
    fullName: '',
    headline: '',
    phone: '',
    location: '',
    college: '',
    graduationYear: '',
    github: '',
    linkedin: '',
    portfolio: '',
    bio: '',
    goal: '',
  },
  saveProfileDetails: (details) => {
    const merged = { ...(get().profileDetails || {}), ...(details || {}) }
    localStorage.setItem('profileDetails', JSON.stringify(merged))
    set({ profileDetails: merged })
  },
}))

export default useStore
