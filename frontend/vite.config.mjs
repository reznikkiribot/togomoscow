import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
};

const cacheHeaders = () => ({
  name: 'preview-cache-headers',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url === '/' || url.startsWith('/?') || url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
      } else if (url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (url === '/telegram-web-app.js') {
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), cacheHeaders()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy,
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy,
  },
});
