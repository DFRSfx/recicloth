/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EAF4EF',
          100: '#D5E9DF',
          200: '#AED3BF',
          300: '#84BC9E',
          400: '#5AA67E',
          500: '#2D6A4F',
          600: '#24563F',
          700: '#1B412F',
          800: '#122D1F',
          900: '#0A1A12',
        },
        secondary: {
          50: '#FDF9F4',
          100: '#FAF3E9',
          200: '#F5EAD8',
          300: '#F2E8DC',
          400: '#D7C7B7',
          500: '#BCAB99',
          600: '#A18F7A',
          700: '#86735E',
          800: '#6B5948',
          900: '#4F4134',
        },
        tertiary: {
          50: '#FFFFFF',
          100: '#FAFAF8',
          200: '#F2F2EE',
          300: '#E9E9E4',
          400: '#E0E0DA',
          500: '#D6D6CF',
          600: '#BABAB5',
          700: '#9E9E9A',
          800: '#82827F',
          900: '#666664',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'secondary': ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
};
