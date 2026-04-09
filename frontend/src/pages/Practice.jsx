import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronRight, RefreshCw, ExternalLink,
  Brain, Code2, BookOpen, Filter, Layers, TrendingUp,
  BarChart3, Zap, Star, CheckCircle, Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { questionAPI, problemAPI, codeAPI } from '../api'
import useStore from '../store/useStore'

// ── Constants ──────────────────────────────────────────────────────────────
const DIFF_COLORS = {
  EASY:   'badge-emerald',
  MEDIUM: 'badge-amber',
  HARD:   'badge-coral',
}

const DIFF_DOT = {
  EASY:   'bg-emerald',
  MEDIUM: 'bg-amber',
  HARD:   'bg-coral',
}

const TAG_TO_TOPIC = {
  'two pointers':       'Two Pointer',
  'binary search':      'Binary Search',
  'sliding window':     'Sliding Window',
  'dynamic programming':'Dynamic Programming',
  'dp':                 'Dynamic Programming',
  'greedy':             'Greedy',
  'graphs':             'Graph',
  'dfs and similar':    'Graph',
  'trees':              'Trees',
  'binary search tree': 'BST',
  'heaps':              'Heap',
  'strings':            'Strings',
  'hashing':            'Hashing',
  'backtracking':       'Backtracking',
  'bit manipulation':   'Bit Manipulation',
  'math':               'Math',
  'number theory':      'Math',
  'sorting':            'Sorting',
  'arrays':             'Arrays',
  'data structures':    'Data Structures',
}

// ── Helper ─────────────────────────────────────────────────────────────────
const fmtNum = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const DEFAULT_CODE = {
  JAVA: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    // Read input from stdin and print output\n    Scanner sc = new Scanner(System.in);\n    // TODO: solve\n  }\n}`,
  PYTHON: `import sys\n\n# Read input from stdin and print output\ndef solve():\n    data = sys.stdin.read().strip().split()\n    # TODO: solve\n\nif __name__ == "__main__":\n    solve()\n`,
  CPP: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: solve\n    return 0;\n}\n`,
}

const normalizeOutput = (s) => (s || '').replace(/\r\n/g, '\n').trim()

// ── Main Component ─────────────────────────────────────────────────────────
export default function Practice() {
  const { addNotification } = useStore()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('q') || ''
  const initialTopic = searchParams.get('topic')

  // Data
  const [problems,       setProblems]       = useState([])
  const [selected,       setSelected]       = useState(null)
  const [attempts,       setAttempts]       = useState({})
  const [topics,         setTopics]         = useState([])
  const [stats,          setStats]          = useState(null)

  // Pagination
  const [page,           setPage]           = useState(0)
  const [hasNext,        setHasNext]        = useState(false)
  const [totalElements,  setTotalElements]  = useState(0)

  // Filters
  const [search,         setSearch]         = useState(initialSearch)
  const [diff,           setDiff]           = useState('ALL')
  const [activeTopic,    setActiveTopic]    = useState(initialTopic || null)
  const [sort,           setSort]           = useState('solved')

  // UI State
  const [loading,        setLoading]        = useState(true)
  const [syncing,        setSyncing]        = useState(false)
  const [regenerating,   setRegenerating]   = useState(false)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)

  // AI Panel
  const [aiOpen,         setAiOpen]         = useState(false)
  const [aiLoading,      setAiLoading]      = useState(false)
  const [aiText,         setAiText]         = useState('')
  const [lang,           setLang]           = useState('JAVA')
  const [code,           setCode]           = useState(DEFAULT_CODE.JAVA)
  const [judgeRunning,   setJudgeRunning]   = useState(false)
  const [judgeResult,    setJudgeResult]    = useState(null)
  const [testCases,      setTestCases]      = useState([
    { input: '5', expected: 'odd' },
    { input: '8', expected: 'even' },
  ])

  const searchTimeout = useRef(null)
  const didInitFilters = useRef(false)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      questionAPI.getStats(),
      questionAPI.getTopics(),
      problemAPI.getAttempts().catch(() => ({ data: [] })),
    ]).then(([s, t, a]) => {
      setStats(s.data)
      setTopics(t.data)
      const map = {}
      a.data.forEach(at => { map[at.problemId] = at.status })
      setAttempts(map)
    }).catch(() => {})

    doFetch(0, true)
  }, []) // eslint-disable-line

  // ── Re-fetch on filter change (debounced for search) ──────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!didInitFilters.current) {
      didInitFilters.current = true
      return
    }
    searchTimeout.current = setTimeout(() => doFetch(0, true), search ? 400 : 0)
    return () => clearTimeout(searchTimeout.current)
  }, [search, diff, activeTopic, sort]) // eslint-disable-line

  // ── Fetch logic ───────────────────────────────────────────────────────────
  const doFetch = useCallback(async (pageNum, reset = false) => {
    setLoading(true)
    try {
      let res
      if (search.trim()) {
        res = await questionAPI.search(search.trim(), pageNum)
      } else {
        res = await questionAPI.getAll({
          page:       pageNum,
          size:       20,
          difficulty: diff !== 'ALL' ? diff : undefined,
          topic:      activeTopic  || undefined,
          sort,
        })
      }
      const d = res.data
      setProblems(prev => reset ? (d.problems ?? []) : [...prev, ...(d.problems ?? [])])
      setHasNext(d.hasNext ?? false)
      setTotalElements(d.totalElements ?? 0)
      setPage(pageNum)
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [search, diff, activeTopic, sort])

  // ── Sync handler ──────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true)
    toast.loading('Syncing from Codeforces…', { id: 'sync' })
    try {
      const res = await questionAPI.sync()
      const d   = res.data
      if (d.status === 'OK') {
        toast.success(`✅ Synced! +${d.added} added · ${d.updated} updated`, { id: 'sync' })
        doFetch(0, true)
        const [s, t] = await Promise.all([questionAPI.getStats(), questionAPI.getTopics()])
        setStats(s.data)
        setTopics(t.data)
      } else {
        toast.error(d.message || 'Sync failed', { id: 'sync' })
      }
    } catch {
      toast.error('Sync request failed', { id: 'sync' })
    } finally {
      setSyncing(false)
    }
  }

  // ── Regenerate Descriptions handler ──────────────────────────────────────
  const handleRegenDescriptions = async () => {
    setRegenerating(true)
    toast.loading('Regenerating descriptions for all problems…', { id: 'regen' })
    try {
      const res = await questionAPI.regenerateDescriptions()
      const d   = res.data
      if (d.status === 'OK') {
        toast.success(`✅ ${d.message}`, { id: 'regen', duration: 5000 })
        doFetch(0, true)   // refresh list so updated previews show immediately
      } else {
        toast.error('Regeneration failed', { id: 'regen' })
      }
    } catch {
      toast.error('Failed to regenerate descriptions', { id: 'regen' })
    } finally {
      setRegenerating(false)
    }
  }

  // ── AI Explain ────────────────────────────────────────────────────────────
  const explainWithAI = async () => {
    if (!selected) return
    setAiOpen(true)
    setAiLoading(true)
    setAiText('')

    const prompt =
      `Explain this competitive programming / DSA problem:\n\n` +
      `Problem: "${selected.title}"\n` +
      `Code: ${selected.problemCode} | Rating: ${selected.rating} | Topic: ${selected.topic}\n` +
      `Tags: ${selected.tags || 'none'}\n\n` +
      `Please provide:\n` +
      `1. 🧩 Simple problem explanation\n` +
      `2. 🔍 Approach & Algorithm\n` +
      `3. ☕ Java solution (clean, with comments)\n` +
      `4. ⚡ Brute force vs Optimized\n` +
      `5. 📊 Time & Space Complexity\n` +
      `6. ⚠️ Common mistakes\n` +
      `7. 🎯 2 follow-up interview questions`

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/chat/stream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: prompt, chatId: null, context: 'dsa' }),
      })

      if (!res.ok) {
        setAiText('⚠️ AI service unavailable.')
        setAiLoading(false)
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   text    = ''

      const read = () => reader.read().then(({ done, value }) => {
        if (done) { setAiLoading(false); return }
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split(/\n\n/)
        buffer = events.pop()
        events.forEach(block => {
          let data = ''
          block.split('\n').forEach(line => {
            if (line.startsWith('data:')) data = line.slice(5).trim()
          })
          if (data && data !== '[DONE]') {
            text += data
            setAiText(text)
          }
        })
        read()
      }).catch(() => setAiLoading(false))

      read()
    } catch {
      setAiText('⚠️ Could not connect to AI.')
      setAiLoading(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectProblem = (p) => {
    setSelected(p)
    setAiOpen(false)
    setAiText('')
  }

  const clickTopic = (name) => {
    setActiveTopic(prev => prev === name ? null : name)
    setSearch('')
    setDiff('ALL')
  }

  useEffect(() => {
    if (!selected) return
    setJudgeResult(null)
    setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.JAVA)
    setTestCases([
      { input: '5', expected: 'odd' },
      { input: '8', expected: 'even' },
    ])
  }, [selected]) // eslint-disable-line

  useEffect(() => {
    setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.JAVA)
  }, [lang])

  const updateCase = (idx, key, value) => {
    setTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [key]: value } : tc))
  }

  const runAndSubmit = async () => {
    if (!selected) return
    const activeCases = testCases.filter(tc => tc.input.trim() || tc.expected.trim())
    if (!activeCases.length) {
      toast.error('Add at least 1 test case')
      return
    }
    setJudgeRunning(true)
    const started = Date.now()
    try {
      let passed = 0
      const details = []
      for (const tc of activeCases) {
        const res = await codeAPI.run({ code, language: lang, stdin: tc.input })
        const out = normalizeOutput(res.data?.output)
        const exp = normalizeOutput(tc.expected)
        const ok = res.data?.success && out === exp
        if (ok) passed += 1
        details.push({
          input: tc.input,
          expected: exp,
          output: out,
          pass: ok,
          error: res.data?.error || '',
          ai: res.data?.aiAnalysis || ''
        })
      }
      const allPassed = passed === activeCases.length
      setJudgeResult({ passed, total: activeCases.length, allPassed, details })
      await problemAPI.submitAttempt(selected.id, {
        code,
        language: lang,
        timeTaken: Math.round((Date.now() - started) / 1000),
        solved: allPassed,
      })
      if (allPassed) {
        setAttempts(prev => ({ ...prev, [selected.id]: 'SOLVED' }))
        addNotification({
          type: 'success',
          title: 'Program Completed',
          message: `You completed ${selected.title} (${selected.problemCode}).`
        })
        toast.success('All test cases passed! Marked completed.')
      } else {
        toast.error(`Passed ${passed}/${activeCases.length}. Not completed yet.`)
      }
    } catch {
      toast.error('Failed to run test cases')
    } finally {
      setJudgeRunning(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ══ Stats Header ════════════════════════════════════════════════════ */}
      <div className="px-4 py-2.5 bg-dark-800 border-b border-dark-300 flex items-center gap-3 flex-wrap shrink-0">
        {/* Live dot + title */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-coral" />
          </span>
          <span className="text-white font-bold text-sm tracking-tight">DSA Practice</span>
        </div>

        {/* Stats chips */}
        {stats && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Layers size={11} className="text-coral" />
              <span>
                <span className="text-white font-semibold">{Number(stats.total ?? 0).toLocaleString()}</span>
                {' '}problems
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="badge badge-emerald text-[8px] py-0">EASY {Number(stats.easy ?? 0).toLocaleString()}</span>
              <span className="badge badge-amber  text-[8px] py-0">MED {Number(stats.medium ?? 0).toLocaleString()}</span>
              <span className="badge badge-coral  text-[8px] py-0">HARD {Number(stats.hard ?? 0).toLocaleString()}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-semibold">
              ⚡ Synced from Codeforces
            </span>
          </>
        )}

        {/* Sync + Fix Descriptions buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleRegenDescriptions}
            disabled={regenerating || syncing}
            title="Regenerate natural-language descriptions for all DB problems"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-gray-400 border border-dark-300 hover:border-violet-500/40 hover:text-violet-400 transition-all disabled:opacity-50"
          >
            <BookOpen size={11} className={regenerating ? 'animate-pulse text-violet-400' : ''} />
            {regenerating ? 'Fixing…' : 'Fix Descriptions'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || regenerating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-gray-400 border border-dark-300 hover:border-coral/40 hover:text-coral transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={syncing ? 'animate-spin text-coral' : ''} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* ══ Main 3-column layout ════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Topic Sidebar ──────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.nav
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 168, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="bg-dark-800 border-r border-dark-300 overflow-y-auto shrink-0 flex flex-col"
            >
              <div className="px-3 py-2 border-b border-dark-300 shrink-0">
                <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Topics</span>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                {/* All */}
                <button
                  onClick={() => clickTopic(null)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    !activeTopic
                      ? 'bg-coral/10 text-coral font-semibold'
                      : 'text-gray-500 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <span>All Problems</span>
                  <span className="text-[8px] opacity-60">{Number(stats?.total ?? 0).toLocaleString()}</span>
                </button>

                {/* Dynamic topics from backend */}
                {topics.map(t => (
                  <button
                    key={t.name}
                    onClick={() => clickTopic(t.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                      activeTopic === t.name
                        ? 'bg-coral/10 text-coral font-semibold'
                        : 'text-gray-500 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[8px] opacity-50 shrink-0 ml-1">{fmtNum(t.count)}</span>
                  </button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* ── Problem List ───────────────────────────────────────────────── */}
        <div className="w-72 bg-dark-800 border-r border-dark-300 flex flex-col shrink-0">

          {/* Filters */}
          <div className="p-3 space-y-2 border-b border-dark-300 shrink-0">
            {/* Search + sidebar toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSidebarOpen(v => !v)}
                title="Toggle topic sidebar"
                className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
              >
                <Layers size={13} />
              </button>
              <div className="relative flex-1">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search problems…"
                  className="input-field w-full pl-7 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Difficulty pills */}
            <div className="flex gap-1">
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(d => (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  className={`flex-1 py-1 rounded-lg text-[8px] font-bold transition-all ${
                    diff === d
                      ? d === 'ALL'    ? 'bg-coral text-white'
                      : d === 'EASY'   ? 'bg-emerald/20 text-emerald border border-emerald/30'
                      : d === 'MEDIUM' ? 'bg-amber/20 text-amber border border-amber/30'
                      :                  'bg-coral/20 text-coral border border-coral/30'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input-field w-full py-1 text-[10px] text-gray-400"
            >
              <option value="solved">Most Solved First</option>
              <option value="rating">Easiest Rating First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Count bar */}
          <div className="px-3 py-1.5 border-b border-dark-300 flex items-center justify-between shrink-0">
            <span className="text-[9px] text-gray-600 font-medium truncate">
              {activeTopic ?? (search ? `"${search}"` : 'All Problems')}
            </span>
            <span className="text-[9px] text-gray-600 shrink-0 ml-2">
              {totalElements.toLocaleString()} problems
            </span>
          </div>

          {/* Problem cards list */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {problems.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.008, 0.25) }}
                onClick={() => selectProblem(p)}
                className={`p-2.5 rounded-xl cursor-pointer mb-1 transition-all group ${
                  selected?.id === p.id
                    ? 'bg-coral/10 border border-coral/30'
                    : 'hover:bg-dark-700 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Difficulty dot */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${DIFF_DOT[p.difficulty] || 'bg-gray-600'}`} />

                  <div className="flex-1 min-w-0">
                    {/* Problem code */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-gray-600 text-[9px] font-mono">{p.problemCode}</span>
                      {p.solvedCount > 10000 && (
                        <span className="text-[8px] text-amber">🔥</span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-white text-xs font-medium leading-tight truncate">{p.title}</p>
                    {/* Meta */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`${DIFF_COLORS[p.difficulty] || 'badge-gray'} badge text-[7px] py-0 px-1`}>
                        {p.difficulty}
                      </span>
                      {p.rating && (
                        <span className="text-[9px] text-gray-600 font-mono">⭐{p.rating}</span>
                      )}
                      {p.topic && (
                        <span className="text-[9px] text-gray-600 truncate">{p.topic}</span>
                      )}
                    </div>
                    {p.solvedCount > 0 && (
                      <p className="text-[9px] text-gray-700 mt-0.5">{fmtNum(p.solvedCount)} solved</p>
                    )}
                  </div>

                  <ChevronRight
                    size={11}
                    className="text-gray-700 group-hover:text-coral shrink-0 mt-1 transition-colors"
                  />
                </div>
              </motion.div>
            ))}

            {/* Loading spinner */}
            {loading && (
              <div className="flex justify-center py-5">
                <div className="w-5 h-5 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
              </div>
            )}

            {/* Load more */}
            {!loading && hasNext && (
              <button
                onClick={() => doFetch(page + 1, false)}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-coral transition-colors rounded-xl hover:bg-dark-700 mt-1 border border-transparent hover:border-dark-300"
              >
                Load more →
              </button>
            )}

            {/* Empty state */}
            {!loading && problems.length === 0 && (
              <div className="text-center py-10">
                <Code2 size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-xs mb-1">No problems found</p>
                {totalElements === 0 && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="text-xs text-coral hover:opacity-80 transition-opacity"
                  >
                    Click Sync Now to load problems →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Problem Detail Panel ───────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* Detail Header */}
            <div className="p-4 border-b border-dark-300 bg-dark-800 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`${DIFF_COLORS[selected.difficulty] || 'badge-gray'} badge`}>
                      {selected.difficulty}
                    </span>
                    {selected.rating && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20 font-mono font-semibold">
                        ⭐ {selected.rating}
                      </span>
                    )}
                    {selected.topic && (
                      <span className="text-gray-500 text-xs">{selected.topic}</span>
                    )}
                    <span className="text-gray-700 font-mono text-[10px]">#{selected.problemCode}</span>
                    {attempts[selected.id] === 'SOLVED' && (
                      <span className="badge badge-emerald text-[9px]">Completed</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selected.title}</h2>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={explainWithAI}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      aiOpen
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-dark-700 text-gray-400 border-dark-300 hover:text-violet-300 hover:border-violet-500/30'
                    }`}
                  >
                    <Brain size={12} />
                    {aiOpen ? 'AI Active' : 'Explain with AI'}
                  </motion.button>

                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20 transition-all"
                  >
                    <ExternalLink size={11} />
                    Solve on {selected.platform}
                  </a>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="card p-3 text-center">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Solved</div>
                  <div className="text-emerald font-bold">{fmtNum(selected.solvedCount)}</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">CF Rating</div>
                  <div className="text-amber font-bold font-mono">{selected.rating ?? '—'}</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Platform</div>
                  <div className="text-coral font-bold text-xs">{selected.platform}</div>
                </div>
              </div>

              {/* Statement preview */}
              {selected.statementPreview && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={12} className="text-gray-500" />
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Problem Info</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.statementPreview}</p>
                </div>
              )}

              {/* Practice Compiler + Testcases */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Run & Verify</h3>
                  <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    className="input-field py-1 px-2 text-[10px]"
                  >
                    <option value="JAVA">Java</option>
                    <option value="PYTHON">Python</option>
                    <option value="CPP">C++</option>
                  </select>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full min-h-48 rounded-xl bg-dark-900 border border-dark-300 p-3 text-xs text-gray-200 font-mono outline-none focus:border-coral/40"
                />
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Test Cases</span>
                    <button
                      onClick={() => setTestCases(prev => [...prev, { input: '', expected: '' }])}
                      className="text-[10px] text-coral hover:opacity-80"
                    >
                      + Add Test
                    </button>
                  </div>
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <textarea
                        value={tc.input}
                        onChange={e => updateCase(idx, 'input', e.target.value)}
                        placeholder="Input"
                        className="rounded-lg bg-dark-900 border border-dark-300 p-2 text-[11px] text-gray-300 font-mono"
                        rows={2}
                      />
                      <textarea
                        value={tc.expected}
                        onChange={e => updateCase(idx, 'expected', e.target.value)}
                        placeholder="Expected output"
                        className="rounded-lg bg-dark-900 border border-dark-300 p-2 text-[11px] text-gray-300 font-mono"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={runAndSubmit}
                    disabled={judgeRunning}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {judgeRunning ? 'Running...' : 'Run All Tests & Submit'}
                  </button>
                  {judgeResult && (
                    <span className={`text-xs ${judgeResult.allPassed ? 'text-emerald' : 'text-amber'}`}>
                      Passed {judgeResult.passed}/{judgeResult.total}
                    </span>
                  )}
                </div>

                {judgeResult && (
                  <div className="mt-3 space-y-2">
                    {judgeResult.details.map((d, idx) => (
                      <div key={idx} className={`rounded-xl border p-3 ${d.pass ? 'border-emerald/30 bg-emerald/5' : 'border-coral/30 bg-coral/5'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${d.pass ? 'text-emerald' : 'text-coral'}`}>
                            {d.pass ? '✓ Passed' : '✗ Failed'} — Test {idx + 1}
                          </span>
                          <span className="text-[10px] text-gray-600">Input → Expected → Output</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <pre className="text-[11px] text-gray-300 whitespace-pre-wrap bg-dark-900/60 border border-dark-300 rounded-lg p-2">{d.input || '—'}</pre>
                          <pre className="text-[11px] text-gray-300 whitespace-pre-wrap bg-dark-900/60 border border-dark-300 rounded-lg p-2">{d.expected || '—'}</pre>
                          <pre className="text-[11px] text-gray-300 whitespace-pre-wrap bg-dark-900/60 border border-dark-300 rounded-lg p-2">{d.output || '—'}</pre>
                        </div>

                        {!!d.error && (
                          <div className="mt-2">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Compiler / Runtime Error</div>
                            <pre className="text-[11px] text-coral whitespace-pre-wrap bg-dark-900/60 border border-coral/20 rounded-lg p-2">{d.error}</pre>
                          </div>
                        )}

                        {!!d.ai && (
                          <div className="mt-2">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Help</div>
                            <pre className="text-[11px] text-gray-200 whitespace-pre-wrap bg-dark-900/60 border border-violet-500/20 rounded-lg p-2">{d.ai}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              {selected.tags && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Tag size={12} className="text-gray-500" />
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const mapped = TAG_TO_TOPIC[tag.toLowerCase()]
                          if (mapped) clickTopic(mapped)
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-dark-700 text-gray-400 border border-dark-300 hover:border-coral/30 hover:text-coral transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AI Explain Panel ── */}
              <AnimatePresence>
                {aiOpen && (
                  <motion.div
                    key="ai-panel"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="card p-4 border-violet-500/20 bg-violet-500/5"
                  >
                    {/* AI Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                        <Brain size={12} className="text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-violet-300">AI Explanation</h3>
                        <p className="text-[9px] text-gray-600">Powered by MiniMax via OpenRouter</p>
                      </div>
                      {aiLoading && (
                        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-violet-400">
                          <div className="w-3 h-3 border border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
                          Generating…
                        </div>
                      )}
                    </div>

                    {/* AI Content */}
                    {aiText ? (
                      <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-sans overflow-auto max-h-96 custom-scroll">
                        {aiText}
                      </pre>
                    ) : aiLoading ? (
                      <div className="flex items-center gap-2 text-gray-600 text-xs py-2">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 bg-violet-400/50 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                        Thinking through the solution…
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Related problems from same topic */}
              {(() => {
                const related = problems.filter(p => p.topic === selected.topic && p.id !== selected.id).slice(0, 6)
                if (!related.length) return null
                return (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <TrendingUp size={12} className="text-gray-500" />
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        More {selected.topic}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {related.map(p => (
                        <button
                          key={p.id}
                          onClick={() => selectProblem(p)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-dark-700 text-gray-400 border border-dark-300 hover:border-coral/30 hover:text-coral transition-colors"
                        >
                          {p.title.length > 28 ? p.title.slice(0, 28) + '…' : p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

        ) : (
          /* ── Empty State ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              {/* Animated icon */}
              <div className="relative inline-block mb-5">
                <div className="w-20 h-20 rounded-2xl bg-coral/10 border border-coral/20 flex items-center justify-center mx-auto">
                  <Code2 size={32} className="text-coral" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald border-2 border-dark-950"
                />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">
                {totalElements > 0 ? 'Select a Problem' : 'No Problems Yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                {totalElements > 0
                  ? `${totalElements.toLocaleString()} problems from Codeforces · Pick one to start`
                  : 'Sync once to load thousands of problems from the Codeforces API'
                }
              </p>
              {totalElements === 0 && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing…' : 'Sync from Codeforces'}
                </button>
              )}

              {/* Quick-access stats */}
              {stats && totalElements > 0 && (
                <div className="flex gap-3 mt-4 justify-center">
                  {[
                    { label: 'Easy',   val: stats.easy,   color: 'text-emerald' },
                    { label: 'Medium', val: stats.medium, color: 'text-amber'   },
                    { label: 'Hard',   val: stats.hard,   color: 'text-coral'   },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                      <div className={`font-bold text-base ${color}`}>{Number(val ?? 0).toLocaleString()}</div>
                      <div className="text-gray-600 text-[10px]">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
