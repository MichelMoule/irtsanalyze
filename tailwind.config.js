/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shine: {
          bg: '#FAFBFC',
          surface: '#FFFFFF',
          border: '#E8ECF0',
          'border-light': '#F0F2F5',
          primary: '#4C35E0',
          'primary-hover': '#3D2AB8',
          'primary-light': '#EDE9FC',
          'text-primary': '#1A1D26',
          'text-secondary': '#6B7280',
          'text-tertiary': '#9CA3AF',
          'text-section': '#9CA3AF',
          'hover-bg': '#F5F5F7',
        },
        primary: {
          50: '#EDE9FC',
          100: '#DDD6FA',
          200: '#BDB0F5',
          300: '#9C89F0',
          400: '#7C63EB',
          500: '#4C35E0',
          600: '#3D2AB8',
          700: '#2E2090',
          800: '#1F1568',
          900: '#100B40',
          950: '#080520',
        },
        status: {
          imported: '#64748b',
          analyzing: '#3b82f6',
          analyzed: '#8b5cf6',
          reviewing: '#f59e0b',
          validated: '#10b981',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
