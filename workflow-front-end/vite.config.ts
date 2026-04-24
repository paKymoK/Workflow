import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      '@state': resolve(__dirname, 'src/hooks/state.ts'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: ['thaiha.website']
  },
})
