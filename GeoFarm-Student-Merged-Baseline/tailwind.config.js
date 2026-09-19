/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', 'Inter', 'sans-serif'],
      },
      colors: {
        // Government Portal specific colors
        gov: {
          navy: '#00592D', // Dark Green
          blue: '#008B45', // Forest Green (Mahapocra Green)
          saffron: '#F28C28',
          bg: '#F5F6F8',
          border: '#D9DEE5',
          text: '#333333',
          textSec: '#666666',
        },
        mahapocra: {
          green: '#008B45', // Title bar green
          bg: '#E8EEF5', // Light app background
        },
        // Flat accessible risk scale
        risk: {
          low: '#2E7D32', // Success Green
          moderate: '#F9A825', // Warning Yellow/Amber
          high: '#E65100', // Orange
          severe: '#C62828', // Danger Red
          critical: '#880E4F', // Dark Red/Purple
        },
        // Keep farm and surface as aliases to prevent immediate crashes, but override to light/gov
        farm: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#174A7E', // override with gov blue for accents
          500: '#123B63',
          600: '#123B63',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        surface: {
          50: '#ffffff',
          100: '#f8fafc',
          800: '#e2e8f0',
          900: '#ffffff', // override dark surfaces to white
          950: '#F5F6F8', // override app bg to gov bg
        },
      },
      boxShadow: {
        card: '0 2px 4px rgba(0,0,0,0.05)',
        header: '0 2px 8px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
