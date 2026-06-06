import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.DISABLE_TAILWIND_VITE_PLUGIN === '1' ? [] : [tailwindcss()]),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 250,
    },
  },
})
