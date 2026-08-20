import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Cloud gateway via SSH tunnel (or local gateway when running one).
        // Override with VITE_PROXY_TARGET when a local dev gateway is up.
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:13000',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_MODE': JSON.stringify(process.env.VITE_API_MODE ?? 'mock'),
  },
});
