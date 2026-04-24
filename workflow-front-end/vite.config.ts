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
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // antd's underlying rc-* component primitives (separate chunk, antd depends on these)
          if (id.includes('/rc-') || id.includes('/@rc-component/')) return 'vendor-rc';
          // ant design icons (large SVG set — kept separate from antd core)
          if (id.includes('/@ant-design/')) return 'vendor-antd-icons';
          // antd core
          if (id.includes('/antd/')) return 'vendor-antd';
          // react flow + layout engine
          if (id.includes('/@xyflow/') || id.includes('/dagre/')) return 'vendor-flow';
          // tiptap rich-text editor + underlying prosemirror packages
          if (id.includes('/@tiptap/') || id.includes('/prosemirror')) return 'vendor-editor';
          // recharts + its d3 peer dependencies + framer-motion
          if (
            id.includes('/recharts/') ||
            id.includes('/d3') ||
            id.includes('/victory-vendor/') ||
            id.includes('/framer-motion/')
          ) return 'vendor-charts';
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
