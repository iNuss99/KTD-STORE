/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#faf9f5',
        'bg-alt': '#f1eee6',
        ink: '#16140f',
        'ink-soft': '#5c5748',
        accent: '#2748ff',
        'accent-dark': '#1732c9',
        coral: '#ff6a3d',
        ok: '#1f7a4d',
        line: 'rgba(22, 20, 15, 0.12)',
        card: '#ffffff',
        smoke: '#64748B',
        steel: '#2B2B2B',
        chalk: '#E2E8F0',
        'warm-white': '#FFFFFF',
        stitch: '#E59210',
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#E59210',
          600: '#D4820B',
          900: '#1E1E1E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        serif: ['"Be Vietnam Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
