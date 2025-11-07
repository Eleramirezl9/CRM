import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/caracteristicas': path.resolve(__dirname, './src/caracteristicas'),
      '@/compartido': path.resolve(__dirname, './src/compartido'),
    },
  },
})
