import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    maxWorkers: 1,
    fileParallelism: false,
    isolate: true,
    // @ts-expect-error - 'forks' is a valid Vitest top-level test option but may not match InlineConfig typings
    forks: {
      execArgv: ['--max-old-space-size=4096'],
    },


  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
