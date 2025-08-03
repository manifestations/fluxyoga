import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Load application configuration
const appConfig = require('./app.config.js');

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: appConfig.development.port,
    host: appConfig.development.host,
    open: appConfig.development.open,
    strictPort: false,
  },
});
