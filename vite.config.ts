import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  // Relative base so built assets resolve under the GitHub Pages subpath.
  base: './',
  resolve: { dedupe: ['react', 'react-dom'] },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        hallucination: resolve(import.meta.dirname, 'hallucination.html'),
      },
    },
  },
})
