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
      output: {
        manualChunks: (id) => {
          // Separate MUI icons into their own chunk
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons';
          }
          // Separate MUI core into its own chunk
          if (id.includes('@mui/material') && !id.includes('@mui/icons-material')) {
            return 'mui-core';
          }
          // Separate React into its own chunk
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // Separate charts into their own chunk
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }
          // Everything else goes to main
          return 'main';
        }
      },
      external: [],
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
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000
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
    include: ['clsx'],
    exclude: ['@mui/icons-material']
  }
})
