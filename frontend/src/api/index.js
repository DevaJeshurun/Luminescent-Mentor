import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Request: attach Bearer token ─────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: auto-refresh token on 401 instead of hard redirect ──────────────
let _refreshing = false
let _refreshQueue = []   // queued calls while a refresh is in-flight

const processQueue = (err, token = null) => {
  _refreshQueue.forEach(({ resolve, reject }) => err ? reject(err) : resolve(token))
  _refreshQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // If it's a 401 and we haven't already retried this request
    if (err.response?.status === 401 && !original._retry) {
      // If a refresh is already in-flight, queue this request
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      _refreshing = true

      try {
        const currentToken = localStorage.getItem('token')
        if (!currentToken) throw new Error('No token stored')

        // Try to get a fresh token using the still-valid current one
        const res = await axios.post('/api/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        })
        const newToken = res.data.token
        localStorage.setItem('token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)

        // Retry the original failed request with new token
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        // Refresh itself failed — token is truly expired → redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        _refreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  login:        (data) => api.post('/auth/login', data),
  register:     (data) => api.post('/auth/register', data),
  me:           ()     => api.get('/auth/me'),
  // Silently renews the JWT without re-login
  refreshToken: ()     => api.post('/auth/refresh'),
}

// Chat
export const chatAPI = {
  getSessions: () => api.get('/chat/sessions'),
  createSession: (data) => api.post('/chat/session', data),
  getMessages: (chatId) => api.get(`/chat/session/${chatId}/messages`),
  deleteSession: (chatId) => api.delete(`/chat/session/${chatId}`),
  streamMessage: (payload, onChunk, onDone, onError) => {
    const token = localStorage.getItem('token')
    fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(payload)
    }).then(async res => {
      if (!res.ok) {
        // On 401 try a silent token refresh then retry once
        if (res.status === 401) {
          try {
            const fresh = await api.post('/auth/refresh')
            const newTok = fresh.data.token
            localStorage.setItem('token', newTok)
            // retry the stream with the new token
            return chatAPI.streamMessage(payload, onChunk, onDone, onError)
          } catch {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return
          }
        }
        const text = await res.text()
        onError && onError(new Error(`HTTP ${res.status}: ${text}`))
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let doneFired = false

      const processBuffer = () => {
        // Split on double-newline = SSE event boundary
        const events = buffer.split(/\n\n/)
        buffer = events.pop() // keep incomplete last chunk

        events.forEach(eventBlock => {
          let eventName = ''
          const dataLines = []
          eventBlock.split('\n').forEach(line => {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLines.push(line.slice(5))
          })
          const dataValue = dataLines.join('\n').replace(/^\s/, '')
          // Fire done on "event: done" or "data: [DONE]"
          if (eventName === 'done' || dataValue === '[DONE]') {
            if (!doneFired) { doneFired = true; onDone && onDone() }
          } else if (dataValue) {
            onChunk && onChunk(dataValue)
          }
        })
      }

      const read = () => reader.read().then(({ done, value }) => {
        if (done) {
          if (buffer.trim()) processBuffer()
          if (!doneFired) { doneFired = true; onDone && onDone() }
          return
        }
        buffer += decoder.decode(value, { stream: true })
        processBuffer()
        read()
      }).catch(err => { onError && onError(err) })

      read()
    }).catch(onError)
  }
}

// Roadmap
export const roadmapAPI = {
  getTopics: () => api.get('/roadmap/topics'),
  getProgress: () => api.get('/roadmap/progress'),
  updateProgress: (topicId, status) => api.put(`/roadmap/progress/${topicId}`, { status }),
  getStats: () => api.get('/roadmap/stats'),
}

// Code
export const codeAPI = {
  run: (data) => api.post('/code/run', data),
  getSnippets: () => api.get('/code/snippets'),
  saveSnippet: (data) => api.post('/code/snippets', data),
  deleteSnippet: (id) => api.delete(`/code/snippets/${id}`),
}

// Problems (legacy local DB)
export const problemAPI = {
  getAll: (params) => api.get('/problems', { params }),
  getById: (id) => api.get(`/problems/${id}`),
  submitAttempt: (id, data) => api.post(`/problems/${id}/attempt`, data),
  getAttempts: () => api.get('/problems/attempts'),
}

// Questions — live Codeforces problem bank
export const questionAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getByCode: (code) => api.get(`/questions/${code}`),
  getByTopic: (topic, page = 0) => api.get(`/questions/topic/${encodeURIComponent(topic)}`, { params: { page } }),
  getByDifficulty: (level, page = 0) => api.get(`/questions/difficulty/${level}`, { params: { page } }),
  search: (q, page = 0, size = 20) => api.get('/questions/search', { params: { q, page, size } }),
  getTopics: () => api.get('/questions/topics'),
  getStats: () => api.get('/questions/stats'),
  sync: () => api.post('/questions/sync/codeforces'),
  regenerateDescriptions: () => api.post('/questions/regenerate-descriptions'),
}

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
}

// Interview
export const interviewAPI = {
  getHistory: () => api.get('/interview/history'),
  submit: (data) => api.post('/interview/submit', data),
}

export default api
