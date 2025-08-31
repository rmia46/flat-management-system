// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Import Tailwind CSS plugin
import path from "path"; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), 
    },
  },
});
