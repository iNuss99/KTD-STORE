/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === KTD Logo Color System ===
        // Logo: #F5A623 orange border, #E07B00 deep orange, #2D2D2D charcoal, #FFFFFF white

        canvas: '#ffffff',
        'bg-alt': '#fdf8f2',
        ink: '#2D2D2D',
        'ink-soft': '#6B6560',
        card: '#ffffff',
        line: 'rgba(45, 45, 45, 0.10)',

        // Brand Orange — extracted from logo
        accent: '#E8920A',
        'accent-dark': '#C47608',
        'accent-light': '#FEF3E2',
        'accent-border': '#F5A623',

        // Status
        coral: '#E05A2B',
        ok: '#1f7a4d',

        // Legacy tokens (kept for backward compat)
        stitch: '#E8920A',
        smoke: '#64748B',
        steel: '#2D2D2D',
        chalk: '#E2E8F0',
        'warm-white': '#FFFFFF',

        // Brand scale — used for amber-style utilities
        brand: {
          50:  '#fff8ed',
          100: '#FEF3E2',
          200: '#fde0a5',
          400: '#F5A623',   // logo border orange
          500: '#E8920A',   // primary accent
          600: '#C47608',   // pressed/dark
          700: '#E07B00',   // logo body deep orange
          900: '#2D2D2D',   // charcoal
        },
      },
      fontFamily: {
        display: ['"Open Sans"', 'sans-serif'],
        sans: ['"Open Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        serif: ['"Open Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
