import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3183",
        pathname: "/api/icons/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "3183",
        pathname: "/api/icons/**",
      },
    ],
  },

  async headers() {
    // needed for multithreaded proving
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // using webpack for `next build` because "Error [TurbopackInternalError]: NftJsonAsset: cannot handle filepath worker_threads"
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
      ".jsx": [".tsx", ".jsx"],
    };
    webpackConfig.resolve.fallback = {
      ...webpackConfig.resolve.fallback,
      net: false,
      os: false,
    };
    return webpackConfig;
  },

  turbopack: {
    resolveAlias: {
      net: { browser: "./empty.ts" },
      os: { browser: "./empty.ts" },
    },
    // needed for .js to resolve to .ts files
    rules: {
      "*.ts": [{ loaders: ["./import-rewrite-loader.js"] }],
      "*.tsx": [{ loaders: ["./import-rewrite-loader.js"] }],
    },
  },
};

export default nextConfig;
