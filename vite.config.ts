import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'development-csp',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler: html => html
        .replace("script-src 'self';", "script-src 'self' 'unsafe-inline';")
        .replace("connect-src 'none';", "connect-src 'self' http://localhost:5173 ws://localhost:5173;"),
    },
  }],
  base: './',
  server: { host: 'localhost', port: 5173, strictPort: true },
  test: { environment: 'node' },
});
