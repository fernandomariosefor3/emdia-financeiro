import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    include: [
      'src/features/today/__tests__/**/*.test.tsx',
      'src/features/today/**/__tests__/**/*.test.ts',
      'src/features/today/**/__tests__/**/*.test.tsx',
      'src/features/prepare-month/__tests__/**/*.test.ts',
      'src/features/prepare-month/__tests__/**/*.test.tsx',
      'src/features/prepare-month/data/__tests__/**/*.test.ts',
      'src/features/prepare-month/data/__tests__/**/*.test.tsx',
      'src/features/whatsapp-link/__tests__/**/*.test.ts',
      'src/features/whatsapp-link/__tests__/**/*.test.tsx',
    ]
  }
}))
