/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#a3d9a5',
          DEFAULT: '#68b36b',
          dark: '#3d7a3e',
        },
      },
      fontSize: {
        'xxs': '0.625rem',
      },      
    },
  },
  darkMode: 'media',
  plugins: [],
};
