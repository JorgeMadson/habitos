import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/habitos/',
  plugins: [VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      id: '/habitos/', name: 'entre• — diário de ações', short_name: 'entre•',
      description: 'Suas ações, em perspectiva. No seu ritmo, mesmo offline.',
      lang: 'pt-BR', start_url: '/habitos/', scope: '/habitos/', display: 'standalone',
      theme_color: '#f8f9f5', background_color: '#f8f9f5',
      icons: [{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'}, {src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,woff2}'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      // Only the app shell is cached here. Firestore owns record persistence.
    },
  })],
});
