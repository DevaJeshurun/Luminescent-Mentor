import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import useStore from '../store/useStore'

const levels = [
  { value: 'BEGINNER', label: '🌱 Beginner', desc: 'New to programming' },
  { value: 'INTERMEDIATE', label: '⚡ Intermediate', desc: 'Know the basics' },
  { value: 'ADVANCED', label: '🔥 Advanced', desc: 'Ready for interviews' },
]

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '', skillLevel: 'BEGINNER' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.register(form)
      setAuth(res.data, res.data.token)
      toast.success('Account created! Let\'s start learning 🚀')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral to-amber flex items-center justify-center glow-coral">
              <Zap size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-white font-bold text-xl">CodeMentor AI</h1>
              <p className="text-coral text-xs tracking-widest uppercase font-semibold">Luminescent Mentor</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Your AI-powered Java & DSA journey starts here.</p>
        </div>

        <div className="card p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-bold mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Username</label>
                <input className="input-field w-full" placeholder="alex_codes" required
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
                <input className="input-field w-full" type="email" placeholder="alex@dev.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Password</label>
              <input className="input-field w-full" type="password" placeholder="••••••••" required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {/* Skill level selector */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">Your Skill Level</label>
              <div className="grid grid-cols-3 gap-2">
                {levels.map(l => (
                  <button key={l.value} type="button"
                    onClick={() => setForm({ ...form, skillLevel: l.value })}
                    className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                      form.skillLevel === l.value
                        ? 'border-coral bg-coral/10 text-coral'
                        : 'border-dark-300 text-gray-400 hover:border-coral/40'}`}>
                    <div className="font-semibold">{l.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Start Learning</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-300 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-coral hover:text-coral-light font-semibold transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
