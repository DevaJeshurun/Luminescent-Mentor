import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Timer, Send, ChevronRight, Trophy, Brain, Star, RotateCcw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { interviewAPI } from '../api'

const INTERVIEW_TYPES = [
  { value: 'DSA', label: '🧠 DSA Round', desc: 'Data structures & algorithms', color: 'coral' },
  { value: 'JAVA_VIVA', label: '☕ Java Viva', desc: 'Core Java concepts', color: 'amber' },
  { value: 'HR', label: '🤝 HR Round', desc: 'Behavioral & situational', color: 'violet' },
  { value: 'CODING', label: '💻 Coding Round', desc: 'Live coding challenge', color: 'emerald' },
]

const QUESTIONS = {
  DSA: [
    'Explain the difference between BFS and DFS. When would you use each?',
    'What is the time complexity of QuickSort in worst, average, and best case?',
    'How does a HashMap work internally in Java?',
    'Explain how you would detect a cycle in a linked list.',
    'What is dynamic programming? Give an example problem.',
  ],
  JAVA_VIVA: [
    'What is the difference between abstract class and interface in Java?',
    'Explain the concept of Java memory model — heap vs stack.',
    'What are generics in Java and why are they used?',
    'Explain the difference between == and .equals() in Java.',
    'What is the purpose of the synchronized keyword?',
  ],
  HR: [
    'Tell me about a time you faced a major technical challenge and how you solved it.',
    'Where do you see yourself in 5 years?',
    'Describe a situation where you had to work with a difficult team member.',
    'Why do you want to work at this company?',
    'What is your greatest technical strength and weakness?',
  ],
  CODING: [
    'Write a function to find the two numbers in an array that sum to a target.',
    'Implement a stack that supports push, pop, and getMin in O(1).',
    'Write code to check if a binary tree is balanced.',
    'Find the longest common subsequence of two strings.',
    'Implement binary search on a rotated sorted array.',
  ],
}

const IDEAL_ANSWERS = {
  'Explain the difference between BFS and DFS. When would you use each?':
    'BFS (Breadth-First Search) explores level by level using a queue — ideal for finding shortest paths. DFS (Depth-First Search) goes deep using a stack/recursion — better for topological sorting, cycle detection, and exploring all paths. BFS has O(V+E) time and O(W) space (W=max width), DFS is O(V+E) time and O(H) space (H=height).',
}

export default function Interview() {
  const [phase, setPhase] = useState('select') // select | active | result
  const [type, setType] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [timer, setTimer] = useState(0)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    interviewAPI.getHistory().then(r => setHistory(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1)
        setSessionTimer(t => t + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startInterview = (t) => {
    setType(t)
    const qs = QUESTIONS[t.value] || []
    setQuestions(qs.sort(() => Math.random() - 0.5).slice(0, 5))
    setAnswers([]); setCurrentQ(0); setTimer(0); setSessionTimer(0)
    setPhase('active')
  }

  const nextQuestion = () => {
    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers); setCurrentAnswer(''); setTimer(0)
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      submitInterview(newAnswers)
    }
  }

  const submitInterview = async (finalAnswers) => {
    setSubmitting(true)
    const score = Math.floor(Math.random() * 30) + 60 // 60-90 range for demo
    try {
      const r = await interviewAPI.submit({
        type: type.value,
        questions: questions.join('||'),
        answers: finalAnswers.join('||'),
        score
      })
      setResult(r.data)
      setPhase('result')
    } catch {
      setResult({ score, feedback: 'Great effort! Keep practicing.', confidenceScore: score + 5 })
      setPhase('result')
    } finally { setSubmitting(false) }
  }

  const reset = () => {
    setPhase('select'); setType(null); setResult(null)
    setAnswers([]); setCurrentAnswer(''); setTimer(0)
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Select screen
  if (phase === 'select') return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">🎤 Mock Interview</h1>
        <p className="text-gray-400 text-sm">Practice real interview scenarios with AI-powered feedback and scoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {INTERVIEW_TYPES.map(t => (
          <motion.div key={t.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }} onClick={() => startInterview(t)}
            className="card card-hover cursor-pointer p-5 text-center">
            <div className="text-3xl mb-3">{t.label.split(' ')[0]}</div>
            <h3 className="text-white font-bold mb-1">{t.label.slice(2)}</h3>
            <p className="text-gray-500 text-xs mb-4">{t.desc}</p>
            <button className="btn-primary w-full text-xs py-2">Start Round</button>
          </motion.div>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Session History</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div>
                  <span className="text-white text-sm font-medium">{h.type} Round</span>
                  <span className="text-gray-500 text-xs ml-2">{h.completedAt?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-coral font-bold">{h.score}/100</div>
                    <div className="text-gray-600 text-[10px]">Score</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${h.score >= 70 ? 'bg-emerald' : 'bg-coral'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Active interview
  if (phase === 'active') return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="badge-coral badge mb-1">{type.label}</span>
          <h2 className="text-white font-bold">Question {currentQ + 1} of {questions.length}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-sm ${
            timer > 120 ? 'border-coral text-coral bg-coral/5' : 'border-dark-300 text-gray-400'}`}>
            <Timer size={14} />{fmt(timer)}
          </div>
          <div className="text-gray-500 text-xs">Session: {fmt(sessionTimer)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track mb-6">
        <div className="progress-fill" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
      </div>

      {/* Question card */}
      <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="card p-6 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-coral/10 border border-coral/20 flex items-center justify-center shrink-0">
            <Brain size={14} className="text-coral" />
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider font-semibold">Interviewer</p>
            <p className="text-white text-base leading-relaxed">{questions[currentQ]}</p>
          </div>
        </div>
      </motion.div>

      {/* Answer textarea */}
      <div className="card p-4 mb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-semibold">Your Answer</p>
        <textarea
          value={currentAnswer}
          onChange={e => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here... Be thorough and mention specific examples."
          rows={6}
          className="w-full bg-transparent text-gray-200 text-sm outline-none resize-none placeholder-gray-700 leading-relaxed"
        />
      </div>

      {/* Ideal answer hint */}
      {IDEAL_ANSWERS[questions[currentQ]] && (
        <div className="card p-4 mb-4 border-violet/20 bg-violet/5">
          <p className="text-[10px] text-violet-400 uppercase font-semibold mb-2">💡 Model Answer Reference</p>
          <p className="text-gray-300 text-xs leading-relaxed">{IDEAL_ANSWERS[questions[currentQ]]}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={reset} className="btn-ghost flex items-center gap-2 text-sm">
          <RotateCcw size={14} /> Quit
        </button>
        <button onClick={nextQuestion} disabled={!currentAnswer.trim() || submitting}
          className="btn-primary flex items-center gap-2 text-sm ml-auto">
          {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {currentQ < questions.length - 1 ? (<>Next Question <ChevronRight size={14} /></>) : (<>Submit Interview <Send size={14} /></>)}
        </button>
      </div>
    </div>
  )

  // Results screen
  if (phase === 'result' && result) return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral to-amber flex items-center justify-center mx-auto mb-4 glow-coral">
          <Trophy size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Interview Complete!</h2>
        <p className="text-gray-400">Here's your performance breakdown</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold gradient-text mb-1">{result.score || 75}</div>
          <div className="text-gray-500 text-xs">Overall Score</div>
          <div className="progress-track mt-3">
            <motion.div className="progress-fill" initial={{ width: 0 }}
              animate={{ width: `${result.score || 75}%` }} transition={{ duration: 1 }} />
          </div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-violet-accent mb-1">{result.confidenceScore || 80}</div>
          <div className="text-gray-500 text-xs">Confidence Score</div>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} className={s <= Math.floor((result.confidenceScore || 80) / 20) ? 'text-amber fill-amber' : 'text-gray-700'} />
            ))}
          </div>
        </div>
      </div>

      {result.feedback && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-coral to-amber flex items-center justify-center text-xs text-white font-bold">AI</div>
            <div>
              <div className="text-white text-sm font-semibold">CodeMentor AI Feedback</div>
              <div className="text-gray-600 text-[10px]">Luminescent Intelligence</div>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{result.feedback}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={reset} className="btn-ghost flex-1 text-sm">Try Another Round</button>
        <button onClick={() => startInterview(type)} className="btn-primary flex-1 text-sm">Retry Same Type</button>
      </div>
    </div>
  )

  return null
}
