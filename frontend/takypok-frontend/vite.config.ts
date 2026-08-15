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
      '@takypok/shared': resolve(__dirname, '../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: ['thaiha.website']
  },
  build: {
    // vendor-rc bundles antd's rc-* primitives, icon set, and cssinjs engine together
    // (they depend on each other, so splitting them causes a circular-chunk warning)
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // antd's rc-* primitives and icon set depend on each other (icons -> rc-util,
          // and rc-* components render icons), so splitting them into separate chunks
          // produced a "circular chunk" warning — keep them together, but apart from
          // antd core so this bucket doesn't balloon past antd's own size.
          if (
            id.includes('/rc-') ||
            id.includes('/@rc-component/') ||
            id.includes('/@ant-design/') ||
            id.includes('/stylis/') ||
            id.includes('/@emotion/')
          ) return 'vendor-rc';
          // antd core
          if (id.includes('/antd/')) return 'vendor-antd';
          // react flow + layout engine (dagre pulls in graphlib + lodash — keep with it)
          if (
            id.includes('/@xyflow/') ||
            id.includes('/dagre/') ||
            id.includes('/graphlib/') ||
            id.includes('/lodash/')
          ) return 'vendor-flow';
          // tiptap rich-text editor + underlying prosemirror + linkify (extension-link)
          if (
            id.includes('/@tiptap/') ||
            id.includes('/prosemirror') ||
            id.includes('/linkifyjs/')
          ) return 'vendor-editor';
          // recharts + its d3/es-toolkit/victory-vendor peer deps + framer-motion
          if (
            id.includes('/recharts/') ||
            id.includes('/d3') ||
            id.includes('/es-toolkit/') ||
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
          // firebase messaging SDK (+ its idb/@noble/cookie transitive deps) — isolated
          // since it's only needed for push notifications, not on every page
          if (
            id.includes('/firebase/') ||
            id.includes('/@firebase/') ||
            id.includes('/idb/') ||
            id.includes('/@noble/') ||
            id.includes('/set-cookie-parser/') ||
            id.includes('/cookie/')
          ) return 'vendor-firebase';
          // hls.js is only used by the video player component, but 1.3MB of source
          // dwarfs everything else in the catch-all bucket — give it its own chunk
          if (id.includes('/hls.js/')) return 'vendor-hls';
          return 'vendor-misc';
        },
      },
    },
  },
})
