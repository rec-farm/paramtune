import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    ssr: true, outDir: 'dist/server', target: 'node22',
    rollupOptions: { input: { index: 'src/server/index.ts', 'auth-index': 'src/server/auth-index.ts', 'migrate-auth': 'src/server/migrate-auth.ts' }, output: { entryFileNames: '[name].js' } },
  },
})
