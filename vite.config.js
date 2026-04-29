import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 💡 1. Tailwind 플러그인 불러오기

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 💡 2. 플러그인 목록에 추가!
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        // Host/Cookie가 localhost vs 127.0.0.1로 갈리지 않게
        changeOrigin: false,
      },
      "/devices": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
    },
  },
})
