import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Define environment variables for the new domain
    __APP_DOMAIN__: JSON.stringify(process.env.VITE_APP_DOMAIN || 'otr-data.com'),
    __APP_URL__: JSON.stringify(process.env.VITE_APP_URL || 'https://otr-data.com'),
  },
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
