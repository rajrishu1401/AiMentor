import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5010,
    proxy: {
      '/api/learn': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
