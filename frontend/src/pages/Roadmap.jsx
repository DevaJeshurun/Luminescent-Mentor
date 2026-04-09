import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, BookOpen, Clock, Target, Trophy, Link as LinkIcon } from 'lucide-react'
import { roadmapAPI } from '../api'
import toast from 'react-hot-toast'

const levelColors = { BEGINNER: 'badge-emerald', INTERMEDIATE: 'badge-amber', ADVANCED: 'badge-coral' }
const categoryColors = {
  FUNDAMENTALS: '#f97066', OOP: '#f59e0b', DATA_STRUCTURES: '#8b5cf6',
  ALGORITHMS: '#10b981', SYSTEM_DESIGN: '#06b6d4'
}

export default function Roadmap() {
  const [topics, setTopics] = useState([])
  const [progress, setProgress] = useState({})
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeLevel, setActiveLevel] = useState('ALL')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([roadmapAPI.getTopics(), roadmapAPI.getProgress(), roadmapAPI.getStats()])
      .then(([t, p, s]) => {
        setTopics(t.data)
        const progressMap = {}
        p.data.forEach(pr => { progressMap[pr.topicId] = pr.status })
        setProgress(progressMap)
        setStats(s.data)
      })
      .catch(() => toast.error('Failed to load roadmap'))
      .finally(() => setLoading(false))
  }, [])

  const updateProgress = async (topicId, status) => {
    try {
      await roadmapAPI.updateProgress(topicId, status)
      setProgress(prev => ({ ...prev, [topicId]: status }))
      if (status === 'COMPLETED') toast.success('Topic completed! 🎉')
    } catch { toast.error('Failed to update progress') }
  }

  const getStatus = (id) => progress[id] || 'NOT_STARTED'
  const parseList = (value) => (value || '').split(',').map(v => v.trim()).filter(Boolean)

  const filteredTopics = topics.filter(topic => {
    const levelOk = activeLevel === 'ALL' || topic.level === activeLevel
    const categoryOk = activeCategory === 'ALL' || topic.category === activeCategory
    return levelOk && categoryOk
  })

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Roadmap list */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">DSA Mastery 🗺️</h1>
            <p className="text-gray-400 text-sm">Track your journey by topic, open numbered practice problems, and solve directly from your roadmap.</p>
          </div>
        </div>

        {/* Dashboard cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="card p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Overall Progress</div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold gradient-text">{stats.percentage}%</div>
                <Target size={16} className="text-coral" />
              </div>
              <div className="progress-track mt-2">
                <motion.div className="progress-fill" initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Completed Topics</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-emerald">{stats.completed}</div>
                <Trophy size={16} className="text-emerald" />
              </div>
              <div className="text-xs text-gray-500 mt-2">Out of {stats.total} total topics</div>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">In Progress</div>
              <div className="text-2xl font-bold text-amber">{stats.inProgress}</div>
              <div className="text-xs text-gray-500 mt-2">Keep this moving daily</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-3 mb-5 space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Filter Roadmap</div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(level => (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                  activeLevel === level
                    ? 'border-coral/40 text-coral bg-coral/10'
                    : 'border-dark-300 text-gray-500 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'FUNDAMENTALS', 'DATA_STRUCTURES', 'ALGORITHMS', 'SYSTEM_DESIGN'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                  activeCategory === cat
                    ? 'border-coral/40 text-coral bg-coral/10'
                    : 'border-dark-300 text-gray-500 hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 roadmap-connector" />

          <div className="space-y-4">
            {filteredTopics.map((topic, i) => {
              const status = getStatus(topic.id)
              const isCompleted = status === 'COMPLETED'
              const isInProgress = status === 'IN_PROGRESS'
              const catColor = categoryColors[topic.category] || '#f97066'

              return (
                <motion.div key={topic.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }} className="flex gap-6 relative">
                  {/* Node */}
                  <div className="relative z-10 shrink-0">
                    <button
                      onClick={() => updateProgress(topic.id, isCompleted ? 'NOT_STARTED' : 'COMPLETED')}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-300 hover:scale-110
                        ${isCompleted ? 'border-emerald bg-emerald/20 glow-coral' :
                          isInProgress ? 'border-amber bg-amber/10' :
                          'border-dark-300 bg-dark-700 hover:border-coral'}`}
                    >
                      {isCompleted ? '✓' : topic.icon}
                    </button>
                  </div>

                  {/* Card */}
                  <div onClick={() => setSelected(selected?.id === topic.id ? null : topic)}
                    className={`flex-1 card card-hover cursor-pointer transition-all duration-200 p-4 ${
                      selected?.id === topic.id ? 'border-coral/40 bg-dark-700' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}>
                            {topic.category?.replace('_', ' ')}
                          </span>
                          <span className={`${levelColors[topic.level]} badge`}>{topic.level}</span>
                        </div>
                        <h3 className="text-white font-bold text-base">{topic.name}</h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{topic.description}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                          <Clock size={11} /><span>Est. {topic.estimatedHours}h</span>
                        </div>
                        {isCompleted && <span className="badge-emerald badge">Completed ✓</span>}
                        {isInProgress && <span className="badge-amber badge">In Progress</span>}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selected?.id === topic.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-dark-300 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-dark-900 rounded-lg p-3">
                            <div className="text-gray-500 mb-1 font-semibold">WHY IT MATTERS</div>
                            <p className="text-gray-300">{topic.whyItMatters}</p>
                          </div>
                          <div className="bg-dark-900 rounded-lg p-3">
                            <div className="text-gray-500 mb-1 font-semibold">COMMON MISTAKES</div>
                            <p className="text-gray-300">{topic.commonMistakes}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 bg-dark-900 rounded-lg p-3">
                            <div className="text-gray-500 mb-2 font-semibold">PRACTICE PROBLEMS</div>
                            <div className="space-y-1.5">
                              {parseList(topic.practiceProblems).map((p, idx) => (
                                <a
                                  key={`${topic.id}-${p}`}
                                  href={`/practice?topic=${encodeURIComponent(topic.name)}&q=${encodeURIComponent(p)}`}
                                  className="flex items-center justify-between rounded-lg border border-dark-300 bg-dark-800 px-2.5 py-1.5 hover:border-coral/30 hover:text-coral transition-colors"
                                >
                                  <span className="text-[11px] text-gray-300">
                                    <span className="text-coral font-semibold mr-2">{idx + 1}.</span>
                                    {p}
                                  </span>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <LinkIcon size={10} />
                                    Solve
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                          <div className="bg-dark-900 rounded-lg p-3 text-center">
                            <div className="text-gray-500 mb-1 font-semibold">COMPLEXITY</div>
                            <div className="text-coral font-mono text-[11px]">{topic.timeComplexity}</div>
                            <div className="text-amber font-mono text-[11px] mt-1">{topic.spaceComplexity}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); updateProgress(topic.id, 'IN_PROGRESS') }}
                            className="btn-ghost text-xs py-1.5 px-3">Mark In Progress</button>
                          <button onClick={e => { e.stopPropagation(); updateProgress(topic.id, 'COMPLETED') }}
                            className="btn-primary text-xs py-1.5 px-3">Mark Complete ✓</button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {filteredTopics.length === 0 && (
              <div className="card p-6 text-center text-sm text-gray-500">
                No topics match current filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resources sidebar */}
      <div className="w-72 border-l border-dark-300 bg-dark-800 p-4 overflow-y-auto hidden xl:block">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Current Topic Resources</h3>
        {selected ? (
          <div className="space-y-3">
            <div className="card p-3">
              <div className="text-[10px] text-coral uppercase tracking-wider mb-1">Deep Read</div>
              <p className="text-white text-sm font-semibold">{selected.name} — Interview Guide</p>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-amber uppercase tracking-wider mb-1">Interview Questions</div>
              <div className="space-y-1.5">
                {selected.interviewQuestions?.split(',').map((q, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                    <ChevronRight size={10} className="text-coral mt-0.5 shrink-0" />{q.trim()}
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-violet-400 uppercase tracking-wider mb-2">Expert Insight</div>
              <blockquote className="text-gray-300 text-xs italic leading-relaxed">
                "Mastering {selected.name} is fundamental to cracking top tech interviews. Focus on the patterns, not just the solutions."
              </blockquote>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-coral to-amber flex items-center justify-center text-[10px] text-white font-bold">AI</div>
                <div>
                  <div className="text-[10px] text-white font-semibold">CodeMentor AI</div>
                  <div className="text-[9px] text-gray-600">Luminescent Intelligence</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen size={32} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-xs">Select a topic to see resources and interview questions</p>
          </div>
        )}
      </div>
    </div>
  )
}
