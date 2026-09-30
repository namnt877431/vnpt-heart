import { defineConfig } from 'vite';

export default defineConfig({
  // './' so the build works from any sub-path (intranet folder, CDN, etc.)
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.4 MB
    rollupOptions: {
      output: {
        // Phaser in its own chunk: browsers keep it cached across game updates.
        manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  server: { port: 5173, host: '0.0.0.0' },
});
