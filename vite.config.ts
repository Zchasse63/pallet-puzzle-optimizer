import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Add support for Next.js App Router file extensions
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  // Optimize build for production
  build: {
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    // Improve chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom',
            'framer-motion',
            'zustand',
            '@tanstack/react-query'
          ],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            'lucide-react'
          ]
        }
      }
    },
    // Enable source maps in production for better error tracking
    sourcemap: true,
  },
  // Optimize for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'zustand',
      '@tanstack/react-query'
    ],
  },
}));
