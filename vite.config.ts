import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";


import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";


export default defineConfig({

  resolve: {
    alias: {

    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  ssr: {
    target: "webworker",
    noExternal: [
    
    ],
    resolve: {
      conditions: ["workerd", "browser"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server",
        "react-router",
        "debug",

      ],
      esbuildOptions: {
        define: {
          global: 'globalThis',
          'process.env': JSON.stringify(process.env)
        }
      }
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto'
    },
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  server: {
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      protocol: "ws",
      port: 2600,
      host: "localhost",
    },
  },
  plugins: [
    cloudflareDevProxy(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
