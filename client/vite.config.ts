import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Modes:
 *   default (`npm run dev` / `npm run build`)       offline demo, mock data (GitHub Pages)
 *   api     (`npm run dev:api` / `npm run build:api`) real backend: login, server progress, admin page
 * In dev, /api and /uploads are proxied to the server on :3000 (`cd server && npm run dev`).
 */
export default defineConfig(({ mode }) => {
  const api = mode === 'api';
  return {
    // './' so the build works from any sub-path (intranet folder, CDN, etc.)
    base: './',
    // build stamp attached to browser error reports (admin → "Lỗi hệ thống")
    define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600, // Phaser alone is ~1.4 MB
      rollupOptions: {
        // the admin page only exists with a backend
        input: api ? { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') } : resolve(__dirname, 'index.html'),
        output: {
          // Phaser in its own chunk: browsers keep it cached across game updates.
          manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
        },
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      // ../shared holds types/rules used by both client and server
      fs: { allow: ['..'] },
      proxy: api
        ? {
            '/api': 'http://localhost:3000',
            '/uploads': 'http://localhost:3000',
          }
        : undefined,
    },
  };
});
