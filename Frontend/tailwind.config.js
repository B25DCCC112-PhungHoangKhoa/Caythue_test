/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gaming: {
          dark: '#0a0d14',
          card: '#121722',
          border: '#1e2638',
          accent: '#00f0ff',
          neon: '#10b981',
          gold: '#f59e0b',
          crimson: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans Display"', 'Roboto', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
