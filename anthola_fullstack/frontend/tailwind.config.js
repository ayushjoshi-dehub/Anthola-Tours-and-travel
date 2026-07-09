/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './admin.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08111f',
        sand: '#f4efe6',
        ember: '#f97316',
        sky: '#38bdf8'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 22px 80px rgba(15,23,42,0.35)'
      }
    }
  },
  plugins: []
};
