/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F172A',
        'bg-secondary': '#1E293B',
        'bg-card': '#1E293B',
        'bg-elevated': '#253347',
        'accent-gold': '#F59E0B',
        'accent-gold-light': '#FCD34D',
        'accent-gold-dim': 'rgba(245, 158, 11, 0.15)',
        'accent-emerald': '#10B981',
        'accent-emerald-dim': 'rgba(16, 185, 129, 0.12)',
        'accent-rose': '#F43F5E',
        'accent-rose-dim': 'rgba(244, 63, 94, 0.12)',
        'accent-blue': '#3B82F6',
        'accent-blue-dim': 'rgba(59, 130, 246, 0.12)',
        'accent-violet': '#8B5CF6',
        'accent-violet-dim': 'rgba(139, 92, 246, 0.12)',
        'accent-amber': '#F59E0B',
        'accent-teal': '#14B8A6',
        'accent-teal-dim': 'rgba(20, 184, 166, 0.12)',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
        'text-dim': '#334155',
        'border': 'rgba(255,255,255,0.07)',
        'border-accent': 'rgba(245, 158, 11, 0.3)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0,0,0,0.3)',
        'md': '0 4px 20px rgba(0,0,0,0.4)',
        'lg': '0 8px 40px rgba(0,0,0,0.5)',
      },
      keyframes: {
        slideUp: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
