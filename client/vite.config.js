import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  resolve: {
    alias: command === 'serve' && process.env.APIARY_PREVIEW === '1' ? [
      { find: /^(.*\/)?services\/supabaseClient(\.js)?$/, replacement: fileURLToPath(new URL('./preview/supabaseClient.js', import.meta.url)) },
      { find: /^(.*\/)?api\/axios(\.js)?$/, replacement: fileURLToPath(new URL('./preview/api.js', import.meta.url)) },
    ] : [],
  },
  define: command === 'serve' && process.env.APIARY_PREVIEW === '1'
    ? { 'import.meta.env.VITE_APIARY_PREVIEW': JSON.stringify('1') } : {},
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
}))
