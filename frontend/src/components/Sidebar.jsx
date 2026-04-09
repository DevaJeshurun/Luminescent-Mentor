import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import {
  LayoutDashboard, MessageSquare, Code2, BookOpen,
  Target, Mic, Settings, Flame, ChevronLeft, ChevronRight,
  Zap, LogOut, Trophy
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'New Chat' },
  { to: '/playground', icon: Code2, label: 'Coding Playground' },
  { to: '/practice', icon: Target, label: 'DSA Practice' },
  { to: '/roadmap', icon: BookOpen, label: 'Roadmap Generator' },
  { to: '/interview', icon: Mic, label: 'Mock Interview' },
]

export default function Sidebar() {
  const { user, streakDays, sidebarCollapsed, toggleSidebar, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-screen flex flex-col bg-dark-800 border-r border-dark-300 relative z-20 shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-5 border-b border-dark-300">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral to-amber flex items-center justify-center shrink-0 glow-coral">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">CodeMentor AI</p>
              <p className="text-coral text-[10px] font-semibold tracking-widest uppercase">Luminescent Mentor</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`
          }>
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-dark-300 p-3 space-y-2">
        {/* Start Coding CTA */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => navigate('/playground')}
              className="w-full btn-primary text-sm py-2 rounded-xl"
            >
              Start Coding
            </motion.button>
          )}
        </AnimatePresence>

        {/* Streak */}
        <div className={`flex items-center gap-2 px-2 py-1.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <Flame size={16} className="text-coral shrink-0 animate-pulse" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-gray-400 font-medium">
                Streak: <span className="text-coral font-bold">{user?.streakDays || 0} Days</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Settings & Logout */}
        <div className="flex items-center gap-1">
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item flex-1 ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
            <Settings size={16} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Settings</motion.span>}
            </AnimatePresence>
          </NavLink>
          <button onClick={handleLogout} className="btn-icon p-2" title="Logout">
            <LogOut size={15} />
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-dark-500 text-gray-500 hover:text-white transition-all">
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}
