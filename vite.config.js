import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Load .env / .env.local from this folder even if `vite` is started with another cwd.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// GitHub Project Pages: https://<user>.github.io/<repo>/
// Set VITE_BASE_PATH=/discourse-map/ in CI (see .github/workflows/deploy-pages.yml).
const base =
  process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH !== '/'
    ? process.env.VITE_BASE_PATH.replace(/\/?$/, '/')
    : '/';

export default defineConfig({
  base,
  envDir: projectRoot,
  plugins: [react()],
  server: {
    proxy: {
      // Dev-only: avoid browser CORS when calling Anthropic from SyntheticTestPanel
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
      },
    },
  },
});
