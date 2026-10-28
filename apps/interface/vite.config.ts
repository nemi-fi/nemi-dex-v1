import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { mkdir, symlink } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// needed for multithreaded proving
const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const lateDiscoveredDeps = ["@radix-ui/react-aspect-ratio"];

// Vercel sets VERCEL=1 in its build environment. There the server runs as a Node.js function
// instead of a Cloudflare Worker.
const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  plugins: [
    !isVercel && cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    !isVercel && linkReactRouterClientBuild(),
    // The wallet (PXE, protocol circuits, simulator wasm) only runs in the browser. Without this,
    // its lazy imports get bundled into the Worker too, which pushes it way past its size limit.
    stubModules("ssr", [
      "@aztec-labs/wallets/embedded",
      "@aztec-labs/wallet-sdk/manager",
    ]),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3184,
    headers: crossOriginIsolationHeaders,
  },
  preview: {
    headers: crossOriginIsolationHeaders,
  },
  worker: {
    format: "es",
  },
  // Imported only from lazily loaded components. Without these, Vite discovers them after the first
  // page load in dev and re-bundles dependencies, which briefly loads two copies of React.
  optimizeDeps: { include: lateDiscoveredDeps },
  environments: {
    ssr: {
      optimizeDeps: { include: lateDiscoveredDeps },
      ...(isVercel && {
        // Bundle dependencies like the Worker build does. Left external, Vercel would trace the
        // Aztec packages from node_modules into the function, which then nears its size limit.
        resolve: { noExternal: true },
        build: { rollupOptions: { input: "./server/vercel.ts" } },
      }),
    },
  },
});

/**
 * The Cloudflare plugin writes client assets to the Build Output Specification directory
 * (`.cloudflare/output/...`) that `cf deploy` uploads, but React Router 8.4 reads and writes its
 * client build at `build/client`. Link the two. Created when the client build starts, i.e. after
 * React Router has cleaned `build/`.
 */
function linkReactRouterClientBuild(): Plugin {
  return {
    name: "link-react-router-client-build",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    async buildStart() {
      const { root } = this.environment.config;
      const assetsDirectory = path.resolve(
        root,
        this.environment.config.build.outDir,
      );
      const reactRouterClientDirectory = path.resolve(root, "build/client");
      await mkdir(assetsDirectory, { recursive: true });
      await mkdir(path.dirname(reactRouterClientDirectory), {
        recursive: true,
      });
      await symlink(assetsDirectory, reactRouterClientDirectory, "dir");
    },
  };
}

/** Resolves `ids` to an empty module in the given Vite environment. */
function stubModules(environment: string, ids: string[]): Plugin {
  const stubId = `\0stub:${environment}`;
  return {
    name: `stub-modules:${environment}`,
    enforce: "pre",
    resolveId(id) {
      if (this.environment.name === environment && ids.includes(id)) {
        return stubId;
      }
    },
    load(id) {
      if (id === stubId) {
        return "export default {};";
      }
    },
  };
}
