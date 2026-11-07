import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * `VITE_BASE` lets the same build target a GitHub Pages project site
 * (`VITE_BASE=/arushi-app/`) without changing anything else. Defaults to `/`.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
