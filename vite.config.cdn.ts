import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// CDN Configuration for production builds
const CDN_URL = process.env.VITE_CDN_URL || '';
const USE_CDN = process.env.VITE_USE_CDN === 'true';

// Popular CDN URLs for common dependencies
const _CDN_EXTERNALS = {
  react: 'https://unpkg.com/react@18/umd/react.production.min.js',
  'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const shouldUseCDN = isProduction && USE_CDN;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      onConsoleLog(log) {
        return !log.includes("React Router Future Flag Warning");
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Configure build for CDN deployment
      ...(shouldUseCDN && {
        // Set base URL for CDN assets
        base: CDN_URL,
        
        // Optimize chunk splitting for CDN
        rollupOptions: {
          output: {
            // Manual chunks for better caching
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('@tanstack')) {
                  return 'tanstack';
                }
                if (id.includes('nostr') || id.includes('@nostrify')) {
                  return 'nostr';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                if (id.includes('@radix-ui') || id.includes('react-hook-form')) {
                  return 'ui-libs';
                }
                return 'vendor';
              }
              
              // App chunks
              if (id.includes('/components/ui/')) {
                return 'ui-components';
              }
              if (id.includes('/components/') && !id.includes('/components/ui/')) {
                return 'app-components';
              }
              if (id.includes('/hooks/')) {
                return 'hooks';
              }
              if (id.includes('/lib/')) {
                return 'lib';
              }
            },
            
            // Add content hash to filenames for cache busting
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
          },
        },
        
        // Increase chunk size warning limit for CDN builds
        chunkSizeWarningLimit: 1000,
        
        // Enable CSS code splitting
        cssCodeSplit: true,
        
        // Minify for production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
    },
    
    // Experimental features for better performance
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (shouldUseCDN) {
          if (hostType === 'js') {
            return `${CDN_URL}/assets/js/${filename}`;
          }
          if (hostType === 'css') {
            return `${CDN_URL}/assets/css/${filename}`;
          }
          if (hostType === 'asset') {
            return `${CDN_URL}/assets/${filename}`;
          }
        }
        return filename;
      },
    },
  };
});