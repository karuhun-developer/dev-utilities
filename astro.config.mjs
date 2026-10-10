// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import AstroPWA from "@vite-pwa/astro";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://utilities.karuhundeveloper.com",

  integrations: [
    sitemap(),
    alpinejs(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Karuhun DevUtils",
        short_name: "DevUtils",
        description: "Developer Utilities for Karuhun",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        navigateFallback: "/",
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        globIgnores: ["**/audio-to-srt.worker-*.js"],
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: "es",
      rollupOptions: {
        external: ["onnxruntime-web/webgpu", "onnxruntime-common"],
        output: {
          // Keep the large WASM runtime on its CDN and share one Tensor implementation.
          paths: {
            "onnxruntime-web/webgpu": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort.webgpu.min.mjs",
            "onnxruntime-common": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort.webgpu.min.mjs",
          },
        },
      },
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    },
  },

  adapter: cloudflare(),
});
