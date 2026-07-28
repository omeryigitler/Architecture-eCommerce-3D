import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const publicAssetUrlPlugin = () => {
  const assetUrls: Record<string, string> = {
    './assets/day.png': '/new-gunduz-day (1).png',
    './assets/night.png': '/new-gunduz-day (2).png',
    './assets/model.glb': '/assets/model.glb',
  };

  const virtualPrefix = '\0public-asset-url:';

  return {
    name: 'public-asset-url-map',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (!importer || !importer.replace(/\\/g, '/').endsWith('/src/App.tsx')) {
        return null;
      }

      const publicUrl = assetUrls[source];
      return publicUrl ? `${virtualPrefix}${publicUrl}` : null;
    },
    load(id: string) {
      if (!id.startsWith(virtualPrefix)) {
        return null;
      }

      return `export default ${JSON.stringify(id.slice(virtualPrefix.length))};`;
    },
  };
};

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [publicAssetUrlPlugin(), react(), tailwindcss()],
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});