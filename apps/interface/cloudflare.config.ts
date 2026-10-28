import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "nemi-interface",
    compatibilityDate: "2026-10-01",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "./workers/app.ts",
    observability: {
      enabled: true,
    },
    // Cache Worker responses that opt in with Cache-Control (e.g. /api/icons). Responses
    // without the header, like SSR pages, are never stored.
    cache: {
      enabled: true,
    },
  },
});
