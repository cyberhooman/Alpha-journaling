/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff4ed',
          100: '#ffe8db',
          200: '#ffccb0',
          300: '#ffb085',
          400: '#ff944d',
          500: '#FF7522',
          600: '#e6661e',
          700: '#cc5619',
          800: '#b34615',
          900: '#993611',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f5ff',
          200: '#c7eaff',
          300: '#92D5F5',
          400: '#5fc4f0',
          500: '#38b4eb',
          600: '#1ea3e6',
          700: '#1783b8',
          800: '#13648a',
          900: '#0f455c',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b8b8b8',
          300: '#8f8f8f',
          400: '#575757',
          500: '#1F1F1F',
          600: '#1a1a1a',
          700: '#141414',
          800: '#0f0f0f',
          900: '#0a0a0a',
        },
        neutral: {
          50: '#fefefe',
          100: '#fcfbfa',
          200: '#f8f5f0',
          300: '#f4efe6',
          400: '#EBD7C0',
          500: '#d9c0a3',
          600: '#c7a986',
          700: '#9a7c5a',
          800: '#6d502e',
          900: '#402302',
        },
        success: '#10b981',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.32,0.72,0,1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
