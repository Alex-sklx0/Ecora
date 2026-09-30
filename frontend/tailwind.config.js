/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          600: '#1f9d55',
          700: '#178a49',
          800: '#126b38',
          900: '#18322d',
        },
        clay: {
          400: '#e7b089',
          500: '#d4896a',
        },
        surface: {
          50: '#f4f7f5',
          100: '#eef2f0',
          200: '#e3eae6',
          300: '#d5ddd8',
        },
        ink: {
          300: '#9ca3af',
          400: '#8b938e',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        signal: {
          error: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
