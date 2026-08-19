import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-router|zustand|@tanstack)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-api",
              test: /node_modules[\\/](axios)[\\/]/,
              priority: 25,
            },
            {
              name: "vendor-forms",
              test: /node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-animation",
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-charts",
              test: /node_modules[\\/](recharts|victory-vendor|d3-)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-map",
              test: /node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-icons",
              test: /node_modules[\\/](lucide-react|react-icons)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-misc",
              test: /node_modules[\\/](date-fns|clsx|tailwind-merge|camelcase-keys|qs)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})