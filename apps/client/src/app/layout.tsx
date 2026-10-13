import { DevModePanel } from "@/components/DevModePanel";
import NodeOverlay from "@/components/NodeOverlay";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nemi: Privacy-First Decentralized Exchange",
  description:
    "Nemi is a revolutionary privacy-focused DEX protecting traders from strategy leaks, copy trading, and doxxing while unlocking trillions in sidelined TradFi capital.",
  keywords: [
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
  ],
  authors: [{ name: "Nemi Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "Nemi: Privacy-First Decentralized Exchange",
    description:
      "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital",
    url: "https://nemi.fi",
    siteName: "Nemi DeFi",
    locale: "en_US",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nemi DeFi Platform",
        type: "image/jpeg",
      },
      {
        url: "/images/og-image-square.jpg",
        width: 800,
        height: 800,
        alt: "Nemi DeFi Platform",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nemi_fi",
    creator: "@nemi_fi",
    title: "Nemi: Privacy-First DeFi",
    description:
      "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital",
    images: [
      {
        url: "/images/twitter-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nemi: Privacy-First Decentralized Exchange",
      },
    ],
  },
  other: {
    "fb:app_id": "", // Add your Facebook App ID if available
    "og:image:secure_url": "https://nemi.fi/images/og-image.jpg",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-title" content="Nemi" />
        <link rel="canonical" href="https://nemi.fi" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <>
          <NodeOverlay>
            <Providers>
              <div>
                {children}
                <DevModePanel />
              </div>
            </Providers>
          </NodeOverlay>
          <>
            <Analytics />
          </>
        </>
      </body>
    </html>
  );
}
