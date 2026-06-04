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
        landing: resolve(import.meta.dirname, 'index.html'),
        rag: resolve(import.meta.dirname, 'rag/index.html'),
        hallucination: resolve(import.meta.dirname, 'hallucination/index.html'),
        verifier: resolve(import.meta.dirname, 'verifier/index.html'),
      },
    },
  },
})
