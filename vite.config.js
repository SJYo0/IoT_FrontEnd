import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// defineConfig에 함수를 전달하면, 현재 실행 모드(개발 vs 운영)를 알 수 있습니다.
export default defineConfig(({ mode }) => {
  // 현재 환경(mode)에 맞는 .env 파일을 불러옵니다.
  const env = loadEnv(mode, process.cwd(), '');
  
  // .env에 VITE_API_BASE_URL이 있으면 그걸 쓰고, 없으면 기본값(127.0.0.1:8080)을 씁니다.
  const targetUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        "/api": {
          target: targetUrl,
          changeOrigin: false,
        },
        "/devices": {
          target: targetUrl,
          changeOrigin: false,
        },
      },
    },
  };
})