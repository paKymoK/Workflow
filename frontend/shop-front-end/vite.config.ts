import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      '@takypok/shared': resolve(__dirname, '../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 3001,
    allowedHosts: ['thaiha.website']
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // antd's underlying rc-* component primitives
          if (id.includes('/rc-') || id.includes('/@rc-component/')) return 'vendor-rc';
          // ant design icons (large SVG set)
          if (id.includes('/@ant-design/')) return 'vendor-antd-icons';
          // antd core
          if (id.includes('/antd/')) return 'vendor-antd';
          // framer-motion
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          // react core
          if (
            id.includes('/react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) return 'vendor-react';
          // data fetching
          if (id.includes('/@tanstack/') || id.includes('/axios/')) return 'vendor-query';
          return 'vendor-misc';
        },
      },
    },
  },
})
