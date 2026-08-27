/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F2EE',
        canvas: '#F5F2EE',
        surface: '#FFFFFF',
        'bg-alt': '#EFECE6',
        ink: '#1A1A1A',
        'ink-soft': '#6E6E6E',
        card: '#FFFFFF',
        line: 'rgba(26, 26, 26, 0.08)',

        // Editorial Accent — Antique Gold & Warm Amber
        accent: '#C8A96E',
        'accent-dark': '#A38345',
        'accent-light': '#F7F2E8',
        'accent-amber': '#E8920A',
        'accent-border': '#F5A623',

        // Status
        coral: '#D4432A',
        ok: '#2A7D4F',

        // Legacy & Semantic Compatibility Tokens
        stitch: '#C8A96E',
        smoke: '#6E6E6E',
        steel: '#2D2D2D',
        chalk: '#E2E8F0',
        'warm-white': '#FFFFFF',

        // Legacy / Brand Scale
        brand: {
          50:  '#F7F2E8',
          100: '#EFECE6',
          200: '#DCCEA5',
          400: '#C8A96E',
          500: '#E8920A',
          600: '#A38345',
          700: '#836731',
          900: '#1A1A1A',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        '2xs': '1px',
        'xs': '2px',
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'sans-serif'],
        serif: ['"Be Vietnam Pro"', 'sans-serif'],
        sans: ['"Lexend"', 'sans-serif'],
        mono: ['"Barlow Condensed"', 'monospace'],
        label: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
