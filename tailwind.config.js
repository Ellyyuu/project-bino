/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        plum: {
          DEFAULT: '#7A3A65',
          dark: '#662E53',
          light: '#8E4877',
        },
        lavender: {
          DEFAULT: '#8F84AE',
          light: '#A399BF',
          dark: '#766B95',
        },
        mascot: {
          teal: '#49676C',
          sage: '#88A4A7',
          navy: '#3B5570',
        },
      },
    },
  },
  plugins: [],
}

