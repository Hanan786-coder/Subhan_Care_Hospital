import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize for low-end devices
  build: {
    // Target modern browsers but keep bundle small
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Dev server performance
  server: {
    hmr: {
      overlay: true,
    },
  },
})
