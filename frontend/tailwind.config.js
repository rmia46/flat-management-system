// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'], // Keep Roboto
      },
      // Custom border radius for expressive shapes
      borderRadius: {
        'xl': '1.25rem', // Default Tailwind xl is 0.75rem. Making it more round.
        '2xl': '1.5rem', // Default 2xl is 1rem. Making it more round.
        '3xl': '2rem',   // Custom larger roundness
        '4xl': '2.5rem', // Even more round
        'full': '9999px',
      },
      // Colors are defined via @theme in index.css for v4
    },
  },
  plugins: [],
}
