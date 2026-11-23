/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#050a14',
        surface: '#08111f',
        panel: '#0a1526',
        edge: '#17253a',
        brand: {
          50: '#eff6ff',
          300: '#93c5fd',
          400: '#5aa2ff',
          500: '#2f7bff',
          600: '#1a5fe0',
          700: '#1449b0',
        },
        aqua: '#22d3ee',
        mint: '#34d399',
        ember: '#fb923c',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 20px 50px -34px rgba(0, 0, 0, 0.95)',
        glow: '0 0 0 1px rgba(47, 123, 255, 0.35), 0 18px 50px -20px rgba(34, 211, 238, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.7', transform: 'scale(0.85)' },
          '70%': { opacity: '0', transform: 'scale(1.35)' },
          '100%': { opacity: '0', transform: 'scale(1.35)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        scan: 'scan 2.6s linear infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
