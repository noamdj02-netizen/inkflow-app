import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'inkflow-logo-v2.png'],
          manifest: {
            name: 'InkFlow - Tattoo Manager',
            short_name: 'InkFlow',
            description: 'Gestion simplifiée pour tatoueurs pro.',
            theme_color: '#0f172a',
            background_color: '#0f172a',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
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
          output: {
            manualChunks: (id) => {
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
