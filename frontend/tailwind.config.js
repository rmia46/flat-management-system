// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Keep this extend block, but ensure it's empty now
      // Shadcn's init command will put its variables here later
    },
  },
  plugins: [],
}
