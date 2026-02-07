/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Soft UI Design System - Variables CSS */
        background: 'var(--background)',
        card: 'var(--card)',
        foreground: 'var(--text-primary)',
        'foreground-muted': 'var(--text-secondary)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        /* Rétrocompatibilité dash */
        dash: {
          bg: 'var(--background)',
          surface: 'var(--card)',
          border: 'var(--border)',
          primary: 'var(--primary)',
          text: 'var(--text-primary)',
          'text-muted': 'var(--text-secondary)',
          'text-subtle': '#94a3b8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      borderRadius: {
        'soft-ui': 'var(--radius)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'soft-light': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-dark': '0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
