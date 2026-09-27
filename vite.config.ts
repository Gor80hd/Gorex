import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  resolve: {
    alias: { '@renderer': resolve(__dirname, 'src/renderer/src') },
  },
  build: {
    outDir: resolve(__dirname, 'dist-tauri-frontend'),
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } },
  },
})
