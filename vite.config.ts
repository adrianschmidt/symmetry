import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ];

export default defineConfig({
  plugins,
  test: { globals: true, environment: "node" },
});
