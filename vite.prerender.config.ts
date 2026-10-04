import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    ssr: 'src/client/prerender.tsx', outDir: 'dist/prerender', target: 'node22',
    rollupOptions: { output: { entryFileNames: 'render.js' } },
  },
})
