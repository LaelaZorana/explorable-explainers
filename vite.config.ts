import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the built assets resolve correctly when served from a
  // GitHub Pages project subpath (e.g. /explorable-explainers/).
  base: './',
  plugins: [react(), tailwindcss()],
})
