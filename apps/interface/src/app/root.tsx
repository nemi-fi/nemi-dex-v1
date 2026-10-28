import { DevModePanel } from "#/components/DevModePanel.js";
import NodeOverlay from "#/components/NodeOverlay.js";
import { Providers } from "#/components/providers.js";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root.js";
import NotFound from "./not-found.js";

import "./globals.css";

const title = "Nemi: Privacy-First Decentralized Exchange";
const shortDescription =
  "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital";

export const meta: Route.MetaFunction = () => [
  { title },
  {
    name: "description",
    content:
      "Nemi is a revolutionary privacy-focused DEX protecting traders from strategy leaks, copy trading, and doxxing while unlocking trillions in sidelined TradFi capital.",
  },
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
  { name: "robots", content: "index, follow" },
  { property: "og:type", content: "website" },
  { property: "og:title", content: title },
  { property: "og:description", content: shortDescription },
  { property: "og:url", content: "https://nemi.fi" },
  { property: "og:site_name", content: "Nemi DeFi" },
  { property: "og:locale", content: "en_US" },
  { property: "og:image", content: "https://nemi.fi/opengraph-image.png" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: "Nemi DeFi" },
  { property: "og:image:type", content: "image/png" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@nemi_fi" },
  { name: "twitter:creator", content: "@nemi_fi" },
  { name: "twitter:title", content: "Nemi: Privacy-First DeFi" },
  { name: "twitter:description", content: shortDescription },
  {
    name: "twitter:image",
    content: "https://nemi.fi/images/twitter-image.jpg",
  },
  { name: "twitter:image:alt", content: title },
];

export const links: Route.LinksFunction = () => [
  { rel: "canonical", href: "https://nemi.fi" },
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/icon0.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/icon1.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
];

export function Layout({ children }: { children: React.ReactNode }) {
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
            <div>
              {children}
              <DevModePanel />
            </div>
          </Providers>
        </NodeOverlay>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
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
