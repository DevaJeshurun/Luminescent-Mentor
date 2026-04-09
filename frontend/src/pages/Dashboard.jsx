import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { Flame, Trophy, Code2, Brain, Target, TrendingUp, ArrowRight, Zap, BookOpen, Star } from 'lucide-react'
import { analyticsAPI } from '../api'
import useStore from '../store/useStore'

const COLORS = { coral: '#f97066', amber: '#f59e0b', violet: '#8b5cf6', emerald: '#10b981' }

const diffColors = { EASY: 'badge-emerald', MEDIUM: 'badge-amber', HARD: 'badge-coral' }

function StatCard({ icon: Icon, label, value, sub, color = 'coral', delay = 0 }) {
  const c = COLORS[color] || COLORS.coral
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c}1a` }}>
          <Icon size={20} style={{ color: c }} />
        </div>
        {sub && <span className="text-emerald text-xs font-semibold bg-emerald/10 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setData({
        username: user?.username || 'Student',
        streakDays: user?.streakDays || 0,
        xpPoints: user?.xpPoints || 0,
        problemsSolved: 0,
        topicsCompleted: 0,
        aiDoubts: 0,
        interviewReadiness: 0,
        javaMastery: 0,
        dsaMastery: 0,
        weeklyActivity: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ day: d, problems: 0, xp: 0 })),
        topicMastery: [
          { topic: 'Fundamentals', score: 0 },
          { topic: 'Data Structures', score: 0 },
          { topic: 'Algorithms', score: 0 },
          { topic: 'System Design', score: 0 },
        ],
      }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-coral/30 border-t-coral rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  )

  const readinessData = [
    { name: 'DSA Mastery', value: data.dsaMastery || 0, fill: COLORS.coral },
    { name: 'Java Mastery', value: data.javaMastery || 0, fill: COLORS.amber },
    { name: 'Interview', value: data.interviewReadiness || 0, fill: COLORS.violet },
  ]
  const solvedThisWeek = (data.weeklyActivity || []).reduce((sum, d) => sum + (d.problems || 0), 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text">{data.username}</span>! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Your AI mentor has personalized today's learning path just for you.
          </p>
        </div>
        {/* Streak card */}
        <div className="card p-4 flex items-center gap-4 min-w-[200px]">
          <div className="text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={14} className="text-coral" />
              <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-white">{data.streakDays} Days</div>
            <div className="text-gray-600 text-[10px] mt-0.5">Active</div>
          </div>
          <div className="flex gap-1">
            {['M','T','W','T','F'].map((d, i) => (
              <div key={i} className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center
                ${i < (data.streakDays % 5) ? 'bg-coral text-white' : 'bg-dark-400 text-gray-600'}`}>{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Code2} label="Problems Solved" value={data.problemsSolved} sub={`+${solvedThisWeek} this week`} color="coral" delay={0} />
        <StatCard icon={BookOpen} label="Topics Completed" value={data.topicsCompleted} color="violet" delay={0.05} />
        <StatCard icon={Brain} label="AI Doubts Asked" value={data.aiDoubts} color="amber" delay={0.1} />
        <StatCard icon={Star} label="XP Points" value={`${data.xpPoints} XP`} sub={data.skillLevel || 'BEGINNER'} color="emerald" delay={0.15} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Problems solved donut */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Problems Solved</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: data.problemsSolved, fill: '#f97066' }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{data.problemsSolved}</span>
                <span className="text-[10px] text-gray-500">TOTAL</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-xs"><span className="text-emerald">Easy</span><span className="text-white font-semibold">{Math.floor(data.problemsSolved * 0.36)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-amber">Medium</span><span className="text-white font-semibold">{Math.floor(data.problemsSolved * 0.54)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-coral">Hard</span><span className="text-white font-semibold">{Math.floor(data.problemsSolved * 0.1)}</span></div>
            </div>
          </div>
        </div>

        {/* Interview readiness */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Interview Readiness</h3>
            <div className="badge-coral text-sm px-3 py-1 rounded-full font-bold">{data.interviewReadiness}%</div>
          </div>
          <div className="space-y-3">
            {readinessData.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="font-semibold" style={{ color: item.fill }}>{item.value}%</span>
                </div>
                <div className="progress-track">
                  <motion.div className="progress-fill" initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    style={{ background: item.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resume coding CTA */}
        <div className="rounded-xl p-5 text-white relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #f97066 0%, #f59e0b 100%)' }}
          onClick={() => navigate('/playground')}>
          <div className="absolute top-3 right-3 opacity-20">
            <Code2 size={60} />
          </div>
          <span className="badge bg-white/20 text-white text-[10px] mb-3 inline-block">● RESUME CODING</span>
          <h3 className="text-xl font-bold mb-1">Reverse a Linked List</h3>
          <p className="text-white/70 text-sm mb-4">Topic: Data Structures — Linked Lists</p>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            Pick up where you left off <ArrowRight size={16} />
          </div>
        </div>

        {/* Topic mastery */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Topic Mastery <span className="text-coral text-sm">(Action Needed)</span></h3>
          <div className="space-y-2.5">
            {data.topicMastery.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-20 shrink-0">{t.topic.toUpperCase()}</span>
                <div className="progress-track flex-1">
                  <motion.div className="progress-fill" initial={{ width: 0 }}
                    animate={{ width: `${t.score}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }}
                    style={{ background: t.score < 50 ? '#f97066' : t.score < 70 ? '#f59e0b' : '#10b981' }} />
                </div>
                <span className="text-xs font-bold w-10 text-right" style={{
                  color: t.score < 50 ? '#f97066' : t.score < 70 ? '#f59e0b' : '#10b981'
                }}>{t.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Weekly Activity</h3>
          <button onClick={() => navigate('/practice')} className="text-coral text-xs font-semibold hover:underline flex items-center gap-1">
            View All History <ArrowRight size={12} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data.weeklyActivity} barSize={20}>
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="problems" name="Problems" fill="#f97066" radius={[4, 4, 0, 0]} />
            <Bar dataKey="xp" name="XP" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
