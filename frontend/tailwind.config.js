/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 950:'#07060f', 900:'#0a0910', 800:'#0d0b18', 700:'#12101f', 600:'#161424', 500:'#1c1929', 400:'#242133', 300:'#2d2a3e' },
        coral: { DEFAULT:'#f97066', dark:'#e55a50', light:'#ffb3ae' },
        amber: { DEFAULT:'#f59e0b', dark:'#d97706' },
        violet: { accent:'#8b5cf6', light:'#a78bfa' },
        emerald: { accent:'#10b981' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        pulseGlow: { '0%,100%':{ boxShadow:'0 0 8px rgba(249,112,102,0.3)' }, '50%':{ boxShadow:'0 0 24px rgba(249,112,102,0.7)' } },
        float: { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } }
      }
    }
  },
  plugins: []
}
