import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Trash2, Bot, User, Copy, Check, Sparkles,
  ChevronDown, Code2, Zap, Bug, Repeat2, Trophy, BookOpen,
  BarChart2, Play, HelpCircle, Save, RefreshCw, X, Clock,
  Database, AlertTriangle, Lightbulb, Languages
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { chatAPI } from '../api'
import useStore from '../store/useStore'

// ── Mode definitions ──────────────────────────────────────────────────────
const MODES = [
  { value: 'EXPLAIN_SIMPLY', label: 'Explain Simply',     icon: <Sparkles size={14} />,  color: '#f97066', desc: 'Plain English explanation with analogies' },
  { value: 'LINE_BY_LINE',   label: 'Line by Line',       icon: <Code2    size={14} />,  color: '#8b5cf6', desc: 'Detailed breakdown of every line' },
  { value: 'DRY_RUN',        label: 'Dry Run',            icon: <Play     size={14} />,  color: '#10b981', desc: 'Step-by-step trace with sample I/O' },
  { value: 'COMPLEXITY',     label: 'Complexity Analysis',icon: <BarChart2 size={14}/>,  color: '#f59e0b', desc: 'Time & space Big-O analysis' },
  { value: 'OPTIMIZE',       label: 'Optimize Code',      icon: <Zap      size={14} />,  color: '#06b6d4', desc: 'Brute force → optimal solution' },
  { value: 'DEBUG',          label: 'Debug Error',        icon: <Bug      size={14} />,  color: '#f97066', desc: 'Find bugs, explain errors, fix code' },
  { value: 'CONVERT',        label: 'Convert Language',   icon: <Languages size={14}/>,  color: '#a78bfa', desc: 'Translate code to another language' },
  { value: 'INTERVIEW',      label: 'Interview Prep',     icon: <Trophy   size={14} />,  color: '#f59e0b', desc: 'FAANG-style approach + follow-ups' },
  { value: 'VIVA',           label: 'Viva Questions',     icon: <HelpCircle size={14}/>, color: '#34d399', desc: 'Exam questions + model answers' },
]

// ── Language detection hint map ───────────────────────────────────────────
const LANG_HINTS = {
  java:'Java', python:'Python', javascript:'JavaScript',
  typescript:'TypeScript', c:'C', cpp:'C++', sql:'SQL',
  go:'Go', rust:'Rust', html:'HTML', css:'CSS',
  jsx:'React/JSX', tsx:'React/TSX', bash:'Bash',
}

function detectLang(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  if (lower.includes('public class') || lower.includes('system.out.println')) return 'Java'
  if (lower.includes('def ') && lower.includes(':')) return 'Python'
  if (lower.includes('console.log') || lower.includes('=>')) return 'JavaScript'
  if (lower.includes('select ') && lower.includes('from ')) return 'SQL'
  if (lower.includes('#include') && lower.includes('cout')) return 'C++'
  if (lower.includes('#include') && lower.includes('printf')) return 'C'
  if (lower.includes('func ') && lower.includes('fmt.')) return 'Go'
  if (lower.includes('fn ') && lower.includes('let mut')) return 'Rust'
  if (lower.includes('<html') || lower.includes('<div')) return 'HTML/CSS'
  if (lower.includes('interface ') || lower.includes(': string')) return 'TypeScript'
  if (lower.includes('jsx') || lower.includes('tsx')) return 'React'
  return null
}

// ── Code Block ────────────────────────────────────────────────────────────
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d0b20] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-gray-500 text-[11px] font-mono ml-2">{language || 'code'}</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-[11px] transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg">
          {copied ? <><Check size={11} className="text-emerald-400" /> Copied!</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus}
        customStyle={{ margin: 0, background: '#07060f', fontSize: '12.5px', padding: '14px 16px', lineHeight: 1.6 }}>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, mode }) {
  const isUser = msg.role === 'USER' || msg.role === 'user'
  const modeInfo = MODES.find(m => m.value === mode)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-[#f97066] to-[#f59e0b]'
          : 'bg-[#161424] border border-white/10'
      }`}>
        {isUser
          ? <User size={15} className="text-white" />
          : <Bot size={15} style={{ color: modeInfo?.color || '#f97066' }} />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-[#f97066]/15 border border-[#f97066]/25 text-white rounded-tr-sm'
          : 'bg-[#0f0d1e] border border-white/8 text-gray-200 rounded-tl-sm'
      }`}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          <div className="markdown min-h-[1.5em]">
            {/* Thinking state */}
            {!msg.content && msg.streaming ? (
              <div className="flex items-center gap-2 text-gray-500 italic">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#f97066]/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs">CodeMentor is thinking...</span>
              </div>
            ) : msg.content?.startsWith('Error:') ? (
              /* Error state */
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                  <AlertTriangle size={13} /> AI Service Notice
                </div>
                <p className="text-gray-300 text-xs">{msg.content.replace('Error: ', '')}</p>
                <p className="text-gray-500 text-xs">💡 Try again in a moment or switch chat mode.</p>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mt-4 mb-2 text-lg font-bold text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold text-white border-b border-white/10 pb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-white">{children}</h3>,
                  p:  ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-300">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 mb-3 text-gray-300">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-gray-300">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-400">{children}</em>,
                  code: ({ inline, className, children }) => {
                    const m = /language-(\w+)/.exec(className || '')
                    const lang = m?.[1]
                    if (inline) return (
                      <code className="px-1.5 py-0.5 rounded-md bg-[#1a1830] border border-white/10 text-[12px] font-mono text-[#f97066]">
                        {children}
                      </code>
                    )
                    return <CodeBlock code={String(children).replace(/\n$/, '')} language={lang} />
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                      <table className="w-full text-xs text-left">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="px-3 py-2 bg-[#1a1830] font-bold text-white border-b border-white/10">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-2 bg-[#0f0d1e] border-b border-white/8 text-gray-300">{children}</td>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#f97066]/40 pl-4 text-gray-400 italic my-3 py-1 bg-[#f97066]/5 rounded-r-xl">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-white/10" />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
            {/* Streaming cursor */}
            {msg.streaming && msg.content && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#f97066]/70 animate-pulse align-middle rounded-sm" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Right Smart Panel ─────────────────────────────────────────────────────
function SmartPanel({ lastUserMsg, lastAiMsg, mode }) {
  const detectedLang = detectLang(lastUserMsg)
  const modeInfo = MODES.find(m => m.value === mode)

  // Extract complexity hints from AI text (supports markdown + bullets)
  const extractComplexity = (text, kind) => {
    if (!text) return null
    const cleaned = text
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/^\s*[-*]\s*/gm, '')
    const regex = kind === 'time'
      ? /time\s*complexity?\s*[:\-]?\s*(o\([^)]+\))/i
      : /space\s*complexity?\s*[:\-]?\s*(o\([^)]+\))/i
    const m = cleaned.match(regex)
    if (m?.[1]) return m[1]

    // Fallback: line contains "time"/"space" and any O(...)
    const lines = cleaned.split('\n')
    for (const line of lines) {
      const lower = line.toLowerCase()
      if ((kind === 'time' && lower.includes('time')) || (kind === 'space' && lower.includes('space'))) {
        const om = line.match(/o\([^)]+\)/i)
        if (om?.[0]) return om[0]
      }
    }
    return null
  }
  const timeValue = extractComplexity(lastAiMsg, 'time')
  const spaceValue = extractComplexity(lastAiMsg, 'space')

  const panelItems = [
    {
      icon: <Languages size={14} />, label: 'Detected Language',
      value: detectedLang || 'Auto-detecting…',
      color: '#8b5cf6',
    },
    {
      icon: <Clock size={14} />, label: 'Time Complexity',
      value: timeValue || 'Send code to analyze',
      color: '#f59e0b',
    },
    {
      icon: <Database size={14} />, label: 'Space Complexity',
      value: spaceValue || 'Send code to analyze',
      color: '#10b981',
    },
  ]

  const tips = [
    { icon: <Lightbulb size={12} />, text: 'Paste code directly and ask your question together.' },
    { icon: <Zap size={12} />, text: `Switch to "${modeInfo?.label}" mode for specific analysis.` },
    { icon: <BookOpen size={12} />, text: 'Ask follow-up questions to go deeper on any concept.' },
  ]

  return (
    <div className="w-64 shrink-0 border-l border-white/8 bg-[#080715] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-[#f97066]" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Smart Panel</span>
        </div>
        <p className="text-[11px] text-gray-500">Live code insights</p>
      </div>

      {/* Active Mode */}
      <div className="p-4 border-b border-white/8">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Active Mode</p>
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${modeInfo?.color}22`, border: `1px solid ${modeInfo?.color}44` }}>
            <span style={{ color: modeInfo?.color }}>{modeInfo?.icon}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{modeInfo?.label}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{modeInfo?.desc}</p>
          </div>
        </div>
      </div>

      {/* Code Analysis */}
      <div className="p-4 border-b border-white/8 space-y-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Code Analysis</p>
        {panelItems.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span style={{ color: item.color }}>{item.icon}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
            <div className="ml-5 px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/8">
              <span className="text-xs font-mono text-white/80">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 space-y-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">💡 Pro Tips</p>
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/3">
            <span className="text-[#f97066] mt-0.5 shrink-0">{tip.icon}</span>
            <p className="text-[11px] text-gray-400 leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Supported Languages */}
      <div className="p-4 border-t border-white/8">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Supported Languages</p>
        <div className="flex flex-wrap gap-1.5">
          {['Java','Python','C++','C','JS','SQL','Go','Rust','HTML','React'].map(lang => (
            <span key={lang} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Quick prompts per mode ────────────────────────────────────────────────
const QUICK_PROMPTS = {
  EXPLAIN_SIMPLY:  ['What does this code do?', 'Explain this like I\'m 10', 'What is recursion?', 'What is a pointer?'],
  LINE_BY_LINE:    ['Explain this code line by line', 'Break down this function', 'What does each line return?'],
  DRY_RUN:         ['Trace through this with input [1,2,3]', 'Show me the variable states', 'What is the output?'],
  COMPLEXITY:      ['What is the Big-O of this?', 'Analyze time and space complexity', 'Can this be O(n log n)?'],
  OPTIMIZE:        ['Optimize this brute force', 'Make this more efficient', 'Reduce time complexity'],
  DEBUG:           ['Why is this giving NullPointerException?', 'Fix my code', 'What is wrong here?'],
  CONVERT:         ['Convert this Java to Python', 'Rewrite this in JavaScript', 'Translate to C++'],
  INTERVIEW:       ['How would I explain this in an interview?', 'What follow-ups will they ask?', 'Best approach for this problem?'],
  VIVA:            ['Generate viva questions for this code', 'What will professor ask?', 'Key concepts I should know?'],
}

// ── Main Chat Component ───────────────────────────────────────────────────
export default function Chat() {
  const [sessions,       setSessions]       = useState([])
  const [activeSession,  setActiveSession]  = useState(null)
  const [messages,       setMessages]       = useState([])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [mode,           setMode]           = useState('EXPLAIN_SIMPLY')
  const [showModeMenu,   setShowModeMenu]   = useState(false)
  const [showPanel,      setShowPanel]      = useState(true)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const { user }   = useStore()

  // last messages for panel
  const lastUser = [...messages].reverse().find(m => m.role === 'USER' || m.role === 'user')
  const lastAI   = [...messages].reverse().find(m => m.role === 'ASSISTANT' || m.role === 'assistant')

  useEffect(() => {
    chatAPI.getSessions().then(r => setSessions(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentMode = MODES.find(m => m.value === mode)

  const createSession = async () => {
    try {
      const r = await chatAPI.createSession({ title: 'New Chat', mode })
      setSessions(prev => [r.data, ...prev])
      setActiveSession(r.data)
      setMessages([])
      inputRef.current?.focus()
    } catch { toast.error('Failed to create session') }
  }

  const loadSession = async (session) => {
    setActiveSession(session)
    setMode(session.mode || 'EXPLAIN_SIMPLY')
    try {
      const r = await chatAPI.getMessages(session.id)
      setMessages(r.data)
    } catch { setMessages([]) }
  }

  const deleteSession = async (e, id) => {
    e.stopPropagation()
    await chatAPI.deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSession?.id === id) { setActiveSession(null); setMessages([]) }
  }

  const sendMessage = async (text) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    const userMsg = { role: 'USER', content: msg, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const aiMsgId = Date.now() + 1
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ASSISTANT', content: '', streaming: true }])

    chatAPI.streamMessage(
      {
        chatId: activeSession?.id,
        message: msg,
        mode,
        history: [...messages, userMsg].map(m => ({ role: m.role.toLowerCase(), content: m.content }))
      },
      (chunk) => setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
      )),
      () => {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m))
        setLoading(false)
      },
      (err) => {
        toast.error('Failed to get AI response')
        setMessages(prev => prev.map(m => m.id === aiMsgId
          ? { ...m, content: 'Error: Could not reach AI. Please try again.', streaming: false }
          : m
        ))
        setLoading(false)
      }
    )
  }

  return (
    <div className="flex h-full bg-[#07060f]">

      {/* ── Session Sidebar ── */}
      <div className="w-52 bg-[#09080f] border-r border-white/8 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/8">
          <button onClick={createSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-[#f97066] to-[#f59e0b] hover:opacity-90 transition-opacity shadow-lg shadow-[#f97066]/20">
            <Plus size={15} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 py-1.5">Recent Chats</p>
          {sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-all text-xs
                ${activeSession?.id === s.id
                  ? 'bg-[#f97066]/12 border border-[#f97066]/25 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Bot size={12} className={activeSession?.id === s.id ? 'text-[#f97066]' : 'text-gray-600'} />
                <span className="truncate">{s.title}</span>
              </div>
              <button onClick={e => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-[#f97066] transition-all shrink-0 ml-1">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-6 px-2">Start a new chat to begin learning</p>
          )}
        </div>

        {/* User info */}
        <div className="p-3 border-t border-white/8">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97066] to-[#f59e0b] flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.username || 'Student'}</p>
              <p className="text-[10px] text-gray-500">Learning mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mode selector bar */}
        <div className="px-4 py-2.5 border-b border-white/8 bg-[#09080f]/80 backdrop-blur-sm flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowModeMenu(v => !v)}
              className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-xl text-sm font-medium transition-all
                bg-white/5 border border-white/10 hover:border-[#f97066]/40 hover:bg-[#f97066]/5 text-white">
              <span style={{ color: currentMode?.color }}>{currentMode?.icon}</span>
              <span>{currentMode?.label}</span>
              <ChevronDown size={13} className={`text-gray-500 transition-transform ${showModeMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showModeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-2 w-72 z-50 rounded-2xl border border-white/10 bg-[#0f0d1e] shadow-2xl shadow-black/50 p-2 overflow-hidden">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest px-3 py-1.5">Select Mode</p>
                    {MODES.map(m => (
                      <button key={m.value} onClick={() => { setMode(m.value); setShowModeMenu(false) }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all
                          ${mode === m.value ? 'bg-white/8 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${m.color}22`, border: `1px solid ${m.color}44` }}>
                          <span style={{ color: m.color }}>{m.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{m.label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">{m.desc}</p>
                        </div>
                        {mode === m.value && (
                          <div className="ml-auto w-2 h-2 rounded-full" style={{ background: m.color }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 ml-1">
            <span style={{ color: currentMode?.color }}>●</span>
            <span>{currentMode?.desc}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); toast.success('Chat cleared') }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                <Trash2 size={12} /> Clear
              </button>
            )}
            <button onClick={() => setShowPanel(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                showPanel ? 'text-[#f97066] bg-[#f97066]/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <BarChart2 size={12} /> Panel
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto">
              {/* Hero */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: `${currentMode?.color}18`,
                    border: `1px solid ${currentMode?.color}40`,
                    boxShadow: `0 0 40px ${currentMode?.color}20`
                  }}>
                  <span style={{ color: currentMode?.color, transform: 'scale(1.8)' }}>{currentMode?.icon}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">CodeMentor AI</h2>
              <p className="text-gray-500 text-sm mb-2 font-medium" style={{ color: currentMode?.color }}>
                {currentMode?.label} Mode
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
                Paste your code and ask anything. I'll explain in the simplest way possible for any programming language.
              </p>

              {/* Quick prompts */}
              <div className="w-full">
                <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-3">Try asking:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(QUICK_PROMPTS[mode] || QUICK_PROMPTS.EXPLAIN_SIMPLY).map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="p-3 rounded-xl text-left text-xs text-gray-400 hover:text-white transition-all
                        bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/6">
                      <span style={{ color: currentMode?.color }}>›</span> {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} msg={msg} mode={mode} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-white/8 bg-[#09080f]/80 backdrop-blur-sm">
          {/* Quick prompts strip when there are messages */}
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {(QUICK_PROMPTS[mode] || []).slice(0, 3).map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10
                    text-gray-400 hover:text-white hover:border-white/20 transition-all whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={`Paste code or ask ${currentMode?.label}… (Enter to send, Shift+Enter for new line)`}
                rows={3}
                className="w-full bg-[#0f0d1e] border border-white/10 focus:border-[#f97066]/50 text-white
                  placeholder-gray-600 rounded-2xl px-4 py-3 text-sm outline-none transition-all resize-none
                  focus:ring-2 focus:ring-[#f97066]/15 leading-relaxed font-mono"
              />
              <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-600">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className={`p-3.5 rounded-2xl transition-all shrink-0 ${
                loading || !input.trim()
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-br from-[#f97066] to-[#f59e0b] text-white hover:opacity-90 shadow-lg shadow-[#f97066]/25 hover:-translate-y-0.5'
              }`}>
              {loading
                ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin block" />
                : <Send size={18} />
              }
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-700 mt-2">
            CodeMentor AI · Powered by MiniMax M2 · Always verify important code in production
          </p>
        </div>
      </div>

      {/* ── Right Smart Panel ── */}
      <AnimatePresence>
        {showPanel && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <SmartPanel lastUserMsg={lastUser?.content} lastAiMsg={lastAI?.content} mode={mode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
