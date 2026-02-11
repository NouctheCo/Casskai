/**
 * CassKai - Vite Bundle Analyzer Configuration
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Usage:
 * npm run build -- --config vite.config.bundle-analyzer.ts
 *
 * Génère un rapport interactif des bundles à analyser:
 * - dist/stats.html (visualisation interactive)
 * - dist/stats.json (données brutes)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// Plugins standards (copie depuis vite.config.ts)
export default defineConfig({
  plugins: [
    react(),

    // Bundle analyzer - visualisation interactive
    visualizer({
      filename: './dist/stats.html',
      open: true, // Ouvrir automatiquement dans le navigateur
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // Options: treemap, sunburst, network
      title: 'CassKai - Bundle Analysis',
      sourcemap: true,
    }),

    // Générer stats.json pour analyse programmatique
    visualizer({
      filename: './dist/stats.json',
      json: true,
      gzipSize: true,
      brotliSize: true,
    }),

    // Compression Gzip + Brotli
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024, // Compresser seulement fichiers >1KB
      deleteOriginalAssets: false,
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Activer sourcemaps pour l'analyse
    sourcemap: true,

    // Chunks manuels optimisés
    rollupOptions: {
      output: {
        manualChunks: {
          // Framework React + Router
          'react-core': ['react', 'react-dom', 'react-router-dom'],

          // UI Framework (Radix UI + Lucide + Framer Motion)
          'ui-framework': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-switch',
            'lucide-react',
            'framer-motion',
          ],

          // Charts et visualisation
          'charts': ['recharts', 'd3-scale', 'd3-shape', 'd3-path'],

          // Forms et validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Date handling
          'date-utils': ['date-fns', 'date-fns/locale'],

          // Supabase client
          'supabase': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],

          // i18n
          'i18n': ['i18next', 'react-i18next'],

          // Documents (PDF, Excel) - LOURD, chunk séparé
          'documents': ['jspdf', 'xlsx', 'file-saver'],

          // Markdown
          'markdown': ['marked', 'dompurify'],

          // Vendor (autres libs)
          'vendor': [
            'clsx',
            'tailwind-merge',
            'react-dropzone',
            'react-hot-toast',
            'sonner',
          ],
        },

        // Noms de chunks lisibles
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return `assets/[name]-[hash].js`;
        },

        // Assets avec hash
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Limite de warning à 1000kb (on optimise après analyse)
    chunkSizeWarningLimit: 1000,

    // Minification Terser (plus agressive)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2, // 2 passes pour meilleure compression
      },
      mangle: {
        safari10: true, // Support Safari 10+
      },
      format: {
        comments: false, // Supprimer tous les commentaires
      },
    },

    // Target navigateurs modernes
    target: 'es2020',

    // Output directory
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Optimisations dev
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
    ],
    exclude: [
      // Exclure libs lourdes du pre-bundling
      '@tensorflow/tfjs',
      'pdfjs-dist',
    ],
  },

  // Server config (identique à vite.config.ts)
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
  },

  // Preview config
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
  },
});
