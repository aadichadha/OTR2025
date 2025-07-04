import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore clsx warning
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('clsx')) {
          return;
        }
        // Ignore circular dependency warnings for MUI icons
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('@mui/icons-material')) {
          return;
        }
        warn(warning);
      }
    },
    // Reasonable chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    include: ['clsx']
  }
})
