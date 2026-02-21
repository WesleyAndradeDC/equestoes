import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Atualiza o SW automaticamente quando há nova versão do app
      registerType: 'autoUpdate',

      // Inclui os assets estáticos da pasta public no cache
      includeAssets: ['favicon.svg', 'icons/*.png'],

      // Manifest do app (o que o browser lê para mostrar o prompt de instalação)
      manifest: {
        name: 'G-CONCURSOS — Gramatique',
        short_name: 'G-Concursos',
        description: 'Plataforma de questões para preparação em concursos públicos',
        theme_color: '#8F39D8',
        background_color: '#0f0a1e',
        display: 'standalone',       // Modo app: sem barra de endereço
        orientation: 'portrait',     // Preferência retrato (mobile)
        start_url: '/',
        scope: '/',
        id: 'gconcursos-gramatique',
        lang: 'pt-BR',
        categories: ['education'],
        icons: [
          {
            src: 'icons/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',    // Ícone adaptativo (Android)
          },
        ],
      },

      // Workbox: estratégia de cache do Service Worker
      workbox: {
        // Arquivos pré-cacheados na instalação (shell do app)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],

        // Não aplicar cache nas rotas da API
        navigateFallbackDenylist: [/^\/api\//],

        // Cache em runtime para recursos externos
        runtimeCaching: [
          {
            // Google Fonts — CSS
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts — arquivos de fonte
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API do backend — nunca usar cache (sempre busca na rede)
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },

      // Desabilita o DevOptions para não mostrar painel de debug em produção
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: '/',
  server: {
    allowedHosts: true,
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 