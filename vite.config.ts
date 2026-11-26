import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    base: '/yazi-quest/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // React only changes when dependencies bump; its own chunk lets a
          // returning player reuse the cached copy when only game code changes.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
              { name: 'icons', test: /node_modules\/lucide-react\// },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['tests/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      },
    },
  };
});
