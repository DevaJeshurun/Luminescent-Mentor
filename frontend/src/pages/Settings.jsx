import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Code2, Trophy, Bell, Shield, LogOut, Award, Activity, CalendarDays, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { analyticsAPI } from '../api'

const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const LANGUAGES = ['JAVA', 'PYTHON', 'C++', 'JAVASCRIPT']

export default function Settings() {
  const { user, logout, profileDetails, saveProfileDetails } = useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [dashboard, setDashboard] = useState(null)
  const [details, setDetails] = useState(profileDetails)

  const handleLogout = () => { logout(); navigate('/login'); toast.success('Logged out') }
  useEffect(() => {
    analyticsAPI.getDashboard().then(r => setDashboard(r.data)).catch(() => {})
  }, [])
  useEffect(() => {
    setDetails(profileDetails)
  }, [profileDetails])

  const topTopics = useMemo(() => {
    return (dashboard?.topicMastery || []).slice().sort((a, b) => b.score - a.score).slice(0, 3)
  }, [dashboard])
  const updateDetails = (key, value) => setDetails(prev => ({ ...prev, [key]: value }))
  const handleSaveProfile = () => {
    saveProfileDetails(details)
    toast.success('Profile details saved')
  }

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'preferences', icon: Code2, label: 'Preferences' },
    { id: 'achievements', icon: Trophy, label: 'Achievements' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
  ]

  const achievements = [
    { icon: '🔥', title: 'Streak Master', desc: 'Maintain a 7-day streak', earned: (user?.streakDays || 0) >= 7 },
    { icon: '⚡', title: 'Speed Coder', desc: 'Solve a problem in under 5 minutes', earned: false },
    { icon: '🧠', title: 'DSA Expert', desc: 'Complete 10 DSA topics', earned: false },
    { icon: '💯', title: 'Perfect Score', desc: 'Get 100% in a mock interview', earned: false },
    { icon: '🚀', title: 'First Blood', desc: 'Solve your first problem', earned: true },
    { icon: '🎯', title: 'Consistent Learner', desc: 'Log in 30 days in a row', earned: false },
  ]

  return (
    <div className="flex h-full">
      {/* Tabs sidebar */}
      <div className="w-52 bg-dark-800 border-r border-dark-300 p-4">
        <h2 className="text-white font-bold mb-4">Settings</h2>
        <div className="space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`sidebar-item w-full ${activeTab === t.id ? 'active' : ''}`}>
              <t.icon size={16} className="shrink-0" />{t.label}
            </button>
          ))}
          <div className="pt-4 border-t border-dark-300 mt-4">
            <button onClick={handleLogout} className="sidebar-item w-full text-coral hover:text-coral">
              <LogOut size={16} className="shrink-0" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl space-y-6">
            <h3 className="section-title">Profile</h3>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="card p-6 xl:col-span-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral to-amber flex items-center justify-center text-white text-2xl font-bold glow-coral">
                    {(details?.fullName || user?.username || 'U')?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{details?.fullName || user?.username}</h3>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <span className="badge-coral badge mt-1">{user?.skillLevel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['XP Points', user?.xpPoints || 0, 'text-coral'], ['Streak', `${user?.streakDays || 0}d`, 'text-amber'], ['Role', user?.role || 'USER', 'text-violet-accent']].map(([label, val, color]) => (
                    <div key={label} className="bg-dark-700 rounded-lg p-3">
                      <div className={`text-lg font-bold ${color}`}>{val}</div>
                      <div className="text-gray-500 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Professional Headline</div>
                  <p className="text-xs text-gray-300">{details?.headline || 'Add a headline in profile details'}</p>
                </div>
              </div>
              <div className="card p-5 xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-coral" />
                    <h4 className="text-sm text-white font-semibold">Personal Details</h4>
                  </div>
                  <button onClick={handleSaveProfile} className="btn-primary text-xs px-3 py-1.5">Save Profile</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['fullName', 'Full Name'], ['headline', 'Professional Headline'],
                    ['phone', 'Phone Number'], ['location', 'Location'],
                    ['college', 'College / University'], ['graduationYear', 'Graduation Year'],
                    ['github', 'GitHub URL'], ['linkedin', 'LinkedIn URL'],
                    ['portfolio', 'Portfolio URL'], ['goal', 'Current Goal']
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                      <input
                        value={details?.[key] || ''}
                        onChange={e => updateDetails(key, e.target.value)}
                        className="input-field w-full py-2 text-xs"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Short Bio</label>
                  <textarea
                    value={details?.bio || ''}
                    onChange={e => updateDetails('bio', e.target.value)}
                    className="input-field w-full py-2 text-xs min-h-24"
                    placeholder="Write a short professional bio about your coding journey..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="card p-5 space-y-3 xl:col-span-2">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-coral" />
                  <h4 className="text-sm text-white font-semibold">Professional Summary</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {(details?.fullName || user?.username || 'Learner')} is a {user?.skillLevel || 'BEGINNER'}-level problem solver focused on DSA and interview readiness.
                  Current performance shows {dashboard?.problemsSolved ?? 0} solved problems and {dashboard?.topicsCompleted ?? 0} completed roadmap topics.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="text-[10px] text-gray-500">Interview Readiness</div>
                    <div className="text-lg text-amber font-bold">{dashboard?.interviewReadiness ?? 0}%</div>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <div className="text-[10px] text-gray-500">DSA Mastery</div>
                    <div className="text-lg text-coral font-bold">{dashboard?.dsaMastery ?? 0}%</div>
                  </div>
                </div>
              </div>
              <div className="card p-5 space-y-3 xl:col-span-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-accent" />
                  <h4 className="text-sm text-white font-semibold">Top Strengths</h4>
                </div>
                {!topTopics.length && <p className="text-xs text-gray-500">Complete more topics to generate strengths.</p>}
                {topTopics.map(t => (
                  <div key={t.topic} className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-300">{t.topic}</span>
                    <span className="text-xs font-bold text-emerald">{t.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald" />
                <h4 className="text-sm text-white font-semibold">Recent Activity (7 days)</h4>
              </div>
              {(dashboard?.weeklyActivity || []).map((d, i) => (
                <div key={`${d.day}-${i}`} className="flex items-center justify-between text-xs border-b border-dark-300/50 pb-1">
                  <div className="flex items-center gap-1.5 text-gray-400"><CalendarDays size={11} /> {d.day}</div>
                  <div className="text-gray-300">{d.problems} solved · {d.xp} XP</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg space-y-6">
            <h3 className="section-title">Preferences</h3>
            <div className="card p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Skill Level</label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map(l => (
                    <button key={l} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      user?.skillLevel === l ? 'border-coral bg-coral/10 text-coral' : 'border-dark-300 text-gray-500 hover:border-coral/40'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Preferred Language</label>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGES.map(l => (
                    <button key={l} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      (user?.preferredLanguage || 'JAVA') === l ? 'border-coral bg-coral/10 text-coral' : 'border-dark-300 text-gray-500 hover:border-coral/40'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success('Preferences saved!')} className="btn-primary text-sm">Save Preferences</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
            <h3 className="section-title">Achievements & Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((a, i) => (
                <div key={i} className={`card p-4 text-center transition-all ${a.earned ? 'border-amber/30 bg-amber/5' : 'opacity-50'}`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className={`text-sm font-bold ${a.earned ? 'text-white' : 'text-gray-500'}`}>{a.title}</div>
                  <div className="text-gray-500 text-xs mt-1">{a.desc}</div>
                  {a.earned && <span className="badge-emerald badge mt-2">Earned ✓</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg space-y-6">
            <h3 className="section-title">Notifications</h3>
            <div className="card p-5 space-y-4">
              {[['Daily coding reminder', true], ['Streak alerts', true], ['New problem alerts', false], ['AI session summary', true]].map(([label, on]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{label}</span>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${on ? 'bg-coral' : 'bg-dark-400'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
