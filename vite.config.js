import { reactRouter } from "@react-router/dev/vite";

import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import autoprefixer from "autoprefixer";
import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths"; // Still removed

export default defineConfig(() => ({
  optimizeDeps: {
    include: ["react-router-dom"],
  },
  server: {
    port: 8788,
    fs: {
      allow: ["app"],
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
  resolve: {
    alias: {
      "~": "/app",
    },
    extensions: [".mjs", ".js", ".jsx", ".json"],
  },
  plugins: [cloudflareDevProxy(), reactRouter()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {},
      output: {
        format: "es",
      },
    },
  },
}));
