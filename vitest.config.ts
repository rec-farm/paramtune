import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolve = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}

export default defineConfig({
  resolve,
  test: {
    globals: true,
    projects: [
      {
        resolve,
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        resolve,
        test: {
          name: 'dom',
          globals: true,
          environment: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          setupFiles: ['tests/setup/dom.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/shared/**', 'src/components/JsonEditable/utils/**'],
    },
  },
})
