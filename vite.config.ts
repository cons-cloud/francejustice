import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Raise warning threshold — pages are now lazy-loaded so individual chunks
    // can legitimately be larger (they are loaded on-demand, not at startup).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Core React runtime ─────────────────────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          // ── React Router ───────────────────────────────────────────────────
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // ── Supabase (auth + realtime) ─────────────────────────────────────
          if (id.includes('node_modules/@supabase/') ||
              id.includes('node_modules/supabase')) {
            return 'supabase';
          }
          // ── framer-motion (animations — ~250 kB) ──────────────────────────
          if (id.includes('node_modules/framer-motion')) {
            return 'framer';
          }
          // ── recharts + d3 (charts — ~200 kB) ─────────────────────────────
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/d3/') ||
              id.includes('node_modules/victory')) {
            return 'charts';
          }
          // ── papaparse (CSV parsing) ────────────────────────────────────────
          if (id.includes('node_modules/papaparse')) {
            return 'papaparse';
          }
          // ── Icons (lucide-react is large — isolated so it's cached separately)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // ── UI headless components ─────────────────────────────────────────
          if (id.includes('node_modules/@headlessui/') ||
              id.includes('node_modules/@radix-ui/')) {
            return 'ui-lib';
          }
          // ── Stripe ─────────────────────────────────────────────────────────
          if (id.includes('node_modules/@stripe/') ||
              id.includes('node_modules/stripe')) {
            return 'stripe';
          }
          // ── Remaining node_modules → shared vendor chunk ───────────────────
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
})