import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B3A6B', 50: '#EDF1F8', 100: '#D5DFEF', 200: '#A9BEDE', 300: '#7E9ECD', 400: '#527DBC', 500: '#2E5FA3', 600: '#264F88', 700: '#1B3A6B', 800: '#142B50', 900: '#0D1C35' },
        blue: { DEFAULT: '#2E5FA3' },
        gold: { DEFAULT: '#E8A020', 50: '#FDF6E9', 100: '#FAEACB', 500: '#E8A020', 600: '#C9871A' },
        status: { green: '#1A7A4A', amber: '#E8A020', red: '#C0392B' },
        surface: { DEFAULT: '#FFFFFF', gray: '#F5F5F5', border: '#E2E8F0' },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,28,53,.08), 0 1px 2px rgba(13,28,53,.04)',
        'card-hover': '0 8px 24px rgba(13,28,53,.12)',
      },
      keyframes: {
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      animation: {
        'slide-in-left': 'slide-in-left .25s ease-out',
        'fade-up': 'fade-up .3s ease-out',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
export default config;
