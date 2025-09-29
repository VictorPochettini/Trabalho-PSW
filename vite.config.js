import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mpeg'],
  
  // ⬇️ CONFIGURAÇÃO SPA ⬇️
  server: {
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
  }
});