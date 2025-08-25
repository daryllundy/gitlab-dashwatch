import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
        'coverage/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/components/ui': path.resolve(__dirname, './src/components/ui'),
      '@/components/common': path.resolve(__dirname, './src/components/common'),
      '@/components/features': path.resolve(__dirname, './src/components/features'),
      '@/components/layout': path.resolve(__dirname, './src/components/layout'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/types': path.resolve(__dirname, './src/types/index.ts'),
      '@/config': path.resolve(__dirname, './src/config/index.ts'),
      '@/constants': path.resolve(__dirname, './src/constants/index.ts'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },
});
