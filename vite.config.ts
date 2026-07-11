import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' → derlenen asset'ler alt klasörde (homedya.com/estetix) çalışır.
// Yönlendirme HashRouter ile yapılır; sunucuda .htaccess rewrite gerekmez.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // manifest.webmanifest zaten elle yönetiliyor (index.html'de <link rel="manifest">) — burada üretme
      manifest: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    // Geliştirmede CORS'u atlamak için: /api istekleri canlı sunucuya
    // (homedya.com/estetix) proxy'lenir. Tarayıcı sadece localhost ile konuşur.
    proxy: {
      '/api': {
        target: 'https://homedya.com/estetix',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
