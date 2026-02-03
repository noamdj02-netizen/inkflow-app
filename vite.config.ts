import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** Inject fetchpriority="high" on main entry script for faster mobile loading (runs after Vite injects assets) */
function priorityScript() {
  return {
    name: 'priority-script',
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return html.replace(
          /<script type="module"(\s+crossorigin)?\s+src="(\/assets\/index-[^"]+\.js)"/,
          '<script type="module"$1 src="$2" fetchpriority="high"'
        );
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  // Base URL canonique (ex. https://ink-flow.me) pour icônes PWA en absolu → logo correct sur mobile
  const baseUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');
  const iconBase = baseUrl || '';
  const icons = [
    { src: `${iconBase}/pwa-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
    { src: `${iconBase}/pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
    { src: `${iconBase}/pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const }
  ];
  if (!baseUrl) {
    icons[0].src = '/pwa-192x192.png';
    icons[1].src = '/pwa-512x512.png';
    icons[2].src = '/pwa-512x512.png';
  }
  // En dev, les routes /api ne sont pas servies par Vite (elles sont Vercel). Proxy vers la prod
  // pour que l'abonnement et le portail Stripe fonctionnent en local. Définir VITE_API_PROXY_TARGET
  // pour cibler une autre URL (ex: https://ink-flow.me) ou laisser vide pour désactiver le proxy.
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ?? (mode === 'development' ? 'https://ink-flow.me' : '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy:
        apiProxyTarget && !apiProxyTarget.includes('localhost')
          ? {
              '/api': {
                target: apiProxyTarget.replace(/\/$/, ''),
                changeOrigin: true,
                secure: true,
              },
            }
          : undefined,
    },
      plugins: [
        react(),
        priorityScript(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'inkflow-logo-v2.png'],
          manifest: {
            name: 'InkFlow - Tattoo Manager',
            short_name: 'InkFlow',
            description: 'Gestion simplifiée pour tatoueurs pro. Réservations, flashs, paiements.',
            theme_color: '#0f172a',
            background_color: '#0f172a',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: baseUrl ? `${baseUrl}/` : '/',
            lang: 'fr',
            categories: ['business', 'productivity'],
            prefer_related_applications: false,
            icons
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'static-images',
                  expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  cacheableResponse: { statuses: [0, 200] }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
          external: (id) => {
            // Exclure Prisma du bundle client (server-side only)
            if (id.includes('@prisma/client') || id.includes('.prisma/client')) {
              return true;
            }
            // Exclure les fichiers serveur Prisma
            if (id.includes('/lib/prisma') || id.includes('/lib/booking-utils')) {
              return true;
            }
            return false;
          },
          output: {
            manualChunks: (id) => {
              // Exclure Prisma du chunking
              if (id.includes('@prisma/client') || id.includes('.prisma/client')) {
                return;
              }
              // Réduit le bundle initial : vendor séparé pour cache et chargement parallèle
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react';
              if (id.includes('node_modules/react-router')) return 'router';
              if (id.includes('node_modules/framer-motion')) return 'framer';
              if (id.includes('node_modules/@supabase/supabase-js')) return 'supabase';
              if (id.includes('node_modules/recharts')) return 'recharts';
              if (id.includes('node_modules/lucide-react')) return 'lucide';
              if (id.includes('node_modules/sonner')) return 'sonner';
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        },
        chunkSizeWarningLimit: 400,
      },
    };
});
