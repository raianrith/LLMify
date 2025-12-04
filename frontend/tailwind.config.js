/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors (softened orange-red)
        brand: {
          50: '#FEF6F4',
          100: '#FDEAE6',
          200: '#FBD5CC',
          300: '#F7B3A3',
          400: '#F29B85',
          500: '#EB593B',  // Primary - softer but bold
          600: '#C23B22',
          700: '#9D2B18',
          800: '#7A2214',
          900: '#5C1A10',
        },
        // Wrike blue for info/highlights
        wrike: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1F7AFC',  // Wrike primary blue
          600: '#1D65D8',
          700: '#1A4FB3',
          800: '#16408F',
          900: '#12326B',
        },
        // Gray palette for backgrounds and text
        gray: {
          50: '#F8FAFC',   // App background
          100: '#F1F5F9',  // Panels, cards
          200: '#E2E8F0',  // Input fields
          300: '#CBD5E1',  // Borders
          400: '#94A3B8',
          500: '#64748B',  // Muted text
          600: '#475569',  // Secondary text
          700: '#334155',  // Body text
          800: '#1E293B',
          900: '#0F172A',  // Headings
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 10px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 20px rgba(0, 0, 0, 0.1)',
        'brand': '0 0 12px rgba(235, 89, 59, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
