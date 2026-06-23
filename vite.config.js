import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@analysis': fileURLToPath(new URL('./src/analysis/chessapp', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/lib/engine', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-recharts': ['recharts'],
          'vendor-chess': ['chess.js'],
        }
      }
    }
  }
})
