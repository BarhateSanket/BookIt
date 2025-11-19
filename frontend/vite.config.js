import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
    },
  },
  build: {
    // Bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          'api-vendor': ['axios'],
          
          // Feature chunks
          'auth-features': [
            './src/pages/Login.tsx',
            './src/pages/Register.tsx',
          ],
          'booking-features': [
            './src/pages/Checkout.tsx',
            './src/pages/Payment.tsx',
            './src/pages/Result.tsx',
          ],
          'experience-features': [
            './src/pages/Details.tsx',
            './src/components/ExperienceCard.tsx',
          ],
        },
      },
    },
    
    // Performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Enable source maps for debugging in development
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server optimizations
  server: {
    // Enable gzip compression
    compress: true,
    
    // Hot module replacement optimizations
    hmr: {
      overlay: false,
    },
  },
  
  // Optimization for dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    exclude: [
      // Large dependencies that should be loaded on demand
    ],
  },
  
  // CSS optimizations
  css: {
    devSourcemap: process.env.NODE_ENV === 'development',
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Asset handling
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  
  // Environment variables
  envPrefix: ['VITE_', 'NODE_'],
  
  // Preview server (for production builds)
  preview: {
    port: 4173,
    strictPort: true,
  },
  
  // Base path configuration
  base: '/',
  
  // Legacy browser support
  target: ['es2015', 'chrome80', 'firefox78', 'safari13'],
  
  // Worker support
  worker: {
    format: 'es',
  },
  
  // JSON parsing
  json: {
    namedExports: true,
  },
  
  // WebAssembly support
  wasm: true,
  
  // Asset URL handling
  assetsDir: 'assets',
  
  // Empty outDir on build
  emptyOutDir: true,
})
