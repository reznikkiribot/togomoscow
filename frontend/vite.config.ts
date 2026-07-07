import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the frontend and backend are served under one origin (the tunnel URL)
// so Telegram only needs a single HTTPS address. Calls to /api are proxied to
// the local NestJS server.
const proxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
};

const cacheHeaders = () => ({
  name: 'preview-cache-headers',
  configurePreviewServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
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
  // dev server (HMR)
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy,
  },
  // production preview — served to real users (hashed assets = cache-proof)
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy,
  },
});
