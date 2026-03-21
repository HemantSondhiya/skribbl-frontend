import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const target = 'http://skribbl-env.eba-cuuiauxr.eu-north-1.elasticbeanstalk.com';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
      },
      '/ws': {
        target,
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
