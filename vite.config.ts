/// <reference types="vitest" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Served from a GitHub Pages project subpath (https://adrianschmidt.github.io/symmetry/).
// PR previews override this to /symmetry/dev/ via the VITE_BASE_PATH env var.
const BASE_PATH = process.env.VITE_BASE_PATH ?? "/symmetry/";

// Prevent the production service worker from intercepting navigations to sibling
// deployments under the same origin (e.g. /symmetry/dev/ when we are the production
// build at /symmetry/). Without this, the prod SW's navigation fallback would serve
// the prod index.html for /symmetry/dev/, blocking the preview from bootstrapping.
const escapedBase = BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const navigateFallbackDenylist = [new RegExp(`^${escapedBase}[^/]+/`)];

// The PWA plugin is disabled under Vitest so it never interferes with the test run.
const plugins = process.env.VITEST
  ? []
  : [
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Symmetry Repair",
          short_name: "Symmetry",
          background_color: "#0e1014",
          theme_color: "#0e1014",
          display: "standalone",
          start_url: BASE_PATH,
          scope: BASE_PATH,
          icons: [
            { src: `${BASE_PATH}icon-192.png`, sizes: "192x192", type: "image/png" },
            { src: `${BASE_PATH}icon-512.png`, sizes: "512x512", type: "image/png" },
          ],
        },
        workbox: { navigateFallbackDenylist },
      }),
    ];

export default defineConfig({
  base: BASE_PATH,
  plugins,
  test: {
    globals: true,
    environment: "node",
    // Skip sibling git worktrees a contributor may check out under `.worktrees/`,
    // so vitest doesn't run tests from other branches alongside this one.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.worktrees/**"],
  },
});
