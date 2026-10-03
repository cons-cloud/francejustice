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
    isolate: false,
    testTimeout: 20000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    server: {
      deps: {
        // Inline-transform these so vi.mock() in setup.ts intercepts before runtime evaluation
        inline: ['@supabase/supabase-js', '@supabase/realtime-js', '@supabase/auth-js', 'framer-motion'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ── CRITICAL: Redirect the 100k-line annuaire dataset to an empty stub ──
      // Without this alias, Vitest tries to transform 100k lines of TS before
      // vi.mock() can intercept it, causing the worker to hang indefinitely.
      [path.resolve(__dirname, './src/data/annuaireAvocatsFrance')]:
        path.resolve(__dirname, './src/data/annuaireAvocatsFrance.stub'),
    },
  },
})
