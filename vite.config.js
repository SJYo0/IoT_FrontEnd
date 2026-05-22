import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
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
