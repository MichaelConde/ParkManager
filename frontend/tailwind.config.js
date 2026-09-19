/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#05070d',
          900: '#0a0e1a',
          850: '#0c1220',
          800: '#0d1424',
          700: '#121a2e',
          600: '#182238',
          500: '#232f4a',
        },
        accent: {
          400: '#34d399',
          500: '#22c55e',
          600: '#16a34a',
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
        status: {
          available: '#22c55e',
          occupied: '#a78bfa',
          reserved: '#f87171',
          alternate: '#f59e0b',
          inactive: '#64748b',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px -8px rgba(34,197,94,0.25)',
        'glow-cyan': '0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px -8px rgba(34,211,238,0.35)',
        'glow-sm': '0 0 20px -4px rgba(34,197,94,0.45)',
        panel: '0 20px 60px -20px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3.5xl': '1.75rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        'fade-in': 'fade-in .45s cubic-bezier(.16,1,.3,1) both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
