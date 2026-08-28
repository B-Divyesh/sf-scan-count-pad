import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html',
      },
    },
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
