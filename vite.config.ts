/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': decodeURIComponent(new URL('./src', import.meta.url).pathname) } },
  server: { port: 5173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
