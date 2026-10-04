import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'server-boundary',
    transform(_code, id) {
      if (/\/src\/(server|models|connections)\//.test(id) || /\/src\/lib\/(auth|apiHandler|dashboardAuth|auditLog|effectRedis|oidc|oidcProfile|oidcLogoutToken)\.ts$/.test(id)) {
        throw new Error(`Server-only module imported by the browser: ${id}`)
      }
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist/client', manifest: true },
  server: {
    host: process.env.VITE_HOST || '127.0.0.1', strictPort: true,
    proxy: { '^/api(?:/|$)': `http://127.0.0.1:${process.env.API_PORT || 3001}`, '/healthz': `http://127.0.0.1:${process.env.API_PORT || 3001}` },
  },
})
