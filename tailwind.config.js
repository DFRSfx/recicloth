/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDF6F0',
          100: '#F5E6D3',
          200: '#E6D7C3',
          300: '#D2B48C',
          400: '#C4A676',
          500: '#8B4513',
          600: '#7D3C0F',
          700: '#6B3410',
          800: '#592D0F',
          900: '#4A250C',
        },
        secondary: {
          50: '#FAF8F5',
          100: '#F5F1E8',
          200: '#E8DCC8',
          300: '#D4C4A8',
          400: '#BFA888',
          500: '#A89074',
          600: '#8B7355',
          700: '#6E5A44',
          800: '#514234',
          900: '#3A2F25',
        },
        tertiary: {
          50: '#FEF7ED',
          100: '#FDEDD3',
          200: '#FBD5A5',
          300: '#F9B66D',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        }
      },
      fontFamily: {
        'sans': ['Urbanist', 'sans-serif'],
        'secondary': ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};