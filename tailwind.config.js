/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Override Indigo with Devlu Brand Colors (Petroleum Blue)
        indigo: {
          50: '#f0f7fa',
          100: '#e0f0f5',
          200: '#bce0eb',
          300: '#8cc5db',
          400: '#54a3c4',
          500: '#3386a8',
          600: '#276788', // Brand Base
          700: '#22536e',
          800: '#20465b',
          900: '#1e3b4d',
          950: '#132835',
        }
      }
    },
  },
  plugins: [],
}
