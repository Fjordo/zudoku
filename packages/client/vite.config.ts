import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const SERVER_ORIGIN = 'http://localhost:8080';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Zudoku',
        short_name: 'Zudoku',
        description: 'Play sudoku solo or race your friends on the same puzzle.',
        lang: 'en',
        theme_color: '#12101c',
        background_color: '#12101c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo play is fully client-side, so the shell is precached for offline use.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/ws/, /^\/healthz/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/ws': { target: SERVER_ORIGIN, ws: true },
      '/healthz': { target: SERVER_ORIGIN },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
