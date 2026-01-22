/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#9B5DE5',
        'brand-pink': '#F15BB5',
        'brand-yellow': '#FEE440',
        'brand-cyan': '#00BBF9',
        'brand-mint': '#00F5D4',
        'brand-purple-dark': '#7C3AED',
        'brand-pink-dark': '#DB2777',
      },
      fontFamily: {
        'display': ['Syne', 'system-ui', 'sans-serif'],
        'serif': ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
