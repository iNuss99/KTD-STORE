/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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

        // Status
        coral: '#D4432A',
        ok: '#2A7D4F',

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
