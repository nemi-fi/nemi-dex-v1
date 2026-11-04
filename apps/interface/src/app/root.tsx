import NodeOverlay from "#/components/NodeOverlay.js";
import { Providers } from "#/components/providers.js";
import { useIsDevEnvironment } from "#/hooks/use-is-dev-environment.js";
import { HomeFooter } from "#/modules/home/ui/components/home-footer/index.js";
import {
  HomeNavbar,
  type NavbarHandle,
} from "#/modules/home/ui/components/home-navar/index.js";
import { Analytics } from "@vercel/analytics/react";
import { Suspense, lazy } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";
import type { Route } from "./+types/root.js";

import "./globals.css";

// The 404 page pulls in framer-motion; load it only when a page is missing
const NotFound = lazy(() => import("./not-found.js"));

// The dev panel pulls in the whole SDK; load it only on dev hosts, so pages stay light in production
const DevModePanel = lazy(() =>
  import("#/components/DevModePanel.js").then((mod) => ({
    default: mod.DevModePanel,
  })),
);

function DevPanel() {
  const isDev = useIsDevEnvironment();
  return isDev ? (
    <Suspense fallback={null}>
      <DevModePanel />
    </Suspense>
  ) : null;
}

const title = "Nemi · private swaps on Aztec that hide your wallet";
const shortDescription =
  "Private token swaps on Aztec. Nobody sees the wallet behind your swap. Self custody: the keys stay with you.";

/** Link preview for X, Telegram and other apps (1200x630, authorship in its XMP). */
const SHARE_IMAGE = "https://nemi.fi/images/landing/nemi-dex-share.png";
const SHARE_IMAGE_ALT =
  "Private swaps on Aztec. Nobody sees your wallet. A swap card shows tokens and amounts, with the wallet blacked out.";

export const meta: Route.MetaFunction = () => [
  { title },
  { name: "description", content: shortDescription },
  {
    name: "keywords",
    content: [
      "DeFi",
      "Privacy",
      "DEX",
      "Decentralized Exchange",
      "Crypto",
      "Trading",
      "Blockchain",
      "private DEX",
      "privacy-focused decentralized exchange",
      "Aztec DEX",
      "zero knowledge DEX",
      "zk-rollup DEX",
      "DeFi privacy",
      "Aztec protocol exchange",
      "shielded trading DeFi",
      "private crypto trading",
      "confidential DeFi",
      "zero-knowledge trading",
      "zk DeFi exchange",
      "Ethereum privacy layer",
      "anonymous crypto swap",
      "private token exchange",
      "on-chain privacy DEX",
      "secure DeFi platform",
      "Aztec privacy layer",
      "privacy-preserving DeFi",
      "decentralized private finance",
    ].join(","),
  },
  { name: "author", content: "Nemi Team" },
  { name: "robots", content: "index, follow, max-image-preview:large" },
  { property: "og:type", content: "website" },
  { property: "og:title", content: title },
  { property: "og:description", content: shortDescription },
  { property: "og:url", content: "https://nemi.fi" },
  { property: "og:site_name", content: "Nemi" },
  { property: "og:locale", content: "en_US" },
  { property: "og:image", content: SHARE_IMAGE },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: SHARE_IMAGE_ALT },
  { property: "og:image:type", content: "image/png" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@nemi_fi" },
  { name: "twitter:creator", content: "@nemi_fi" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: shortDescription },
  { name: "twitter:image", content: SHARE_IMAGE },
  { name: "twitter:image:alt", content: SHARE_IMAGE_ALT },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/icon0.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/icon1.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
];

/** Navbar props from the deepest matched route that sets them in its `handle` (e.g. the landing). */
function useNavbarProps() {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const navbar = (matches[i]!.handle as NavbarHandle | undefined)?.navbar;
    if (navbar) return navbar;
  }
  return undefined;
}

// Every page, the error and 404 screens included, shares the header and footer rendered here
export function Layout({ children }: { children: React.ReactNode }) {
  const navbarProps = useNavbarProps();
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="white"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#121212"
        />
        <meta name="apple-mobile-web-app-title" content="Nemi" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased min-h-screen">
        <NodeOverlay>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <header role="banner" className="sticky top-0 z-40">
                <HomeNavbar {...navbarProps} />
              </header>
              <div className="flex flex-1 flex-col">{children}</div>
              <HomeFooter />
            </div>
            <DevPanel />
          </Providers>
        </NodeOverlay>
        <ScrollRestoration />
        <Scripts />
        {/* Vercel Web Analytics: page views, incl. client-side navigation; the script is served
            from this domain (/_vercel/insights), so cross-origin isolation doesn't block it */}
        {import.meta.env.VITE_ON_VERCEL && <Analytics />}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }

  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    details = error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold">Error</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
