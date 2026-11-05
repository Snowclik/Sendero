import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

// Configuración estática 100% offline para empaquetado en Tauri v2
export default defineConfig({
  server: {
    port: 8742,
    host: true,
  },
  vite: {
    optimizeDeps: {
      include: ['three', 'preact', 'preact/hooks', 'lucide-preact'],
    },
  },
  integrations: [
    preact({ compat: false }),
    tailwind({
      applyBaseStyles: true,
    }),
  ],
  output: 'static',
  build: {
    format: 'file',
  },
});
