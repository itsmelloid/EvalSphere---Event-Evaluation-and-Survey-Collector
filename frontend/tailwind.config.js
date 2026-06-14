/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#3D7FFF', dark: '#2D6FEF', light: '#6DA3FF', dim: '#1E3D7A' },
        surface:  { DEFAULT: '#131929', 2: '#1C2438', 3: '#242D42' },
        border:   { DEFAULT: '#2A3650', 2: '#354165' },
        bgBase:   '#0B0F1A',
      },
      fontFamily: { sans: ['Outfit', 'sans-serif'], serif: ['"DM Serif Display"', 'serif'] },
    },
  },
  plugins: [],
};
