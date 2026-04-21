import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 💡 1. Tailwind 플러그인 불러오기

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 💡 2. 플러그인 목록에 추가!
  ],
})
