import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config for Vercel deployment
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore common warnings that don't affect functionality
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('clsx')) {
          return;
        }
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        warn(warning);
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
}) 