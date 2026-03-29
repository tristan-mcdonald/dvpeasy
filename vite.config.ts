import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';
import history from 'connect-history-api-fallback';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [
      react(),
      svgr(),
      {
        name: 'spa-fallback',
        configureServer (server) {
          return () => {
            server.middlewares.use(history({
              index: '/index.html',
              disableDotRule: true,
              rewrites: [
                { from: /^\/api\/.*$/, to: function (context) {
                  return context.parsedUrl.pathname;
                }},
              ],
            }));
          };
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
      middlewareMode: false,
      fs: {
        strict: false,
      },
      proxy: {
        '/api/1inch': {
          target: 'https://tokens.1inch.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/1inch/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Add the authorisation header with the API key.
              const apiKey = env.VITE_API_KEY_ONEINCH;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
              proxyReq.setHeader('Accept', 'application/json');
            });
          },
        },
      },
    },
    build: {
      target: 'es2022',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      outDir: 'dist',
      rollupOptions: {
        external: [
          '@safe-globalThis/safe-apps-provider',
          '@safe-globalThis/safe-apps-sdk',
        ],
        output: {
          manualChunks: undefined,
        },
      },
    },
    optimizeDeps: {
      exclude: ['@base-org/account'],
      esbuildOptions: {
        target: 'es2022',
        supported: {
          'import-assertions': true,
        },
      },
    },
    define: {
      global: 'globalThis',
      'process.env': {},
    },
  };
});
