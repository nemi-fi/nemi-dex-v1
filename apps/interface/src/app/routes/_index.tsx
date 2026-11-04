"use client";

import type { NavbarHandle } from "#/modules/home/ui/components/home-navar/index.js";
import { SWAPS_OPEN } from "#/modules/landing/launch-state.js";
import { WaitlistNavButton } from "#/modules/landing/ui/cta-links.js";
import HeroSection from "#/modules/landing/ui/hero-section.js";
import { Suspense, lazy, useEffect } from "react";

/** The landing's sections, listed in the mobile menu. */
const PAGE_LINKS = [
  { name: "What anyone can see", href: "#visibility-heading" },
  { name: "Why the wallet matters", href: "#wallet-diagram-heading" },
  { name: "How a swap works", href: "#how-it-works-heading" },
  { name: "Questions", href: "#faq-heading" },
] as const;

/** Shown in the browser tab while the visitor is looking at another tab. */
const AWAY_TITLE = "Nobody's watching.";

/**
 * Small jokes on the theme of the page: the tab title changes while you are away, and a note
 * waits in the console for anyone digging for wallets.
 */
function useLandingEasterEggs(): void {
  useEffect(() => {
    const title = document.title;
    const onVisibility = (): void => {
      document.title = document.hidden ? AWAY_TITLE : title;
    };
    document.addEventListener("visibilitychange", onVisibility);
    console.log(
      "%cLooking for someone's wallet? It isn't in here either.",
      "font: bold 14px system-ui; background: #000; color: #fff; padding: 4px 8px; border-radius: 4px",
    );
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.title = title;
    };
  }, []);
}

// The landing sections are imported directly, not lazily: lazy sections never finished rendering
// on the server, so crawlers (which wait for the whole page) got no HTML for them.
import ClosingCta from "#/modules/landing/ui/closing-cta.js";
import Faq from "#/modules/landing/ui/faq.js";
import HowItWorks from "#/modules/landing/ui/how-it-works.js";
import VisibilityTable from "#/modules/landing/ui/visibility-table.js";
import WalletDiagram from "#/modules/landing/ui/wallet-diagram.js";
import { LandingSchema } from "#/modules/landing/ui/landing-schema.js";
import type { Route } from "./+types/_index.js";

// The root layout's navbar: the waitlist button until swaps open, and the sections in the mobile menu
export const handle: NavbarHandle = {
  navbar: {
    action: SWAPS_OPEN ? undefined : <WaitlistNavButton />,
    pageLinks: PAGE_LINKS,
  },
};

export const links: Route.LinksFunction = () => [
  { rel: "canonical", href: "https://nemi.fi/" },
];

// The swap form and its token context are heavy and only shown once swaps are open, so they stay in
// their own chunks
const TokenProvider = lazy(() =>
  import("#/modules/home/ui/components/swap-section/TokenContext.js").then(
    (mod) => ({ default: mod.TokenProvider }),
  ),
);
const SwapSection = lazy(() =>
  import("#/modules/home/ui/components/swap-section/index.js").then((mod) => ({
    default: mod.SwapSection,
  })),
);

// Skeleton loaders
const SwapSkeleton = () => (
  <div className="w-full max-w-md mx-auto">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
      <div className="flex justify-center my-4">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
    </div>
  </div>
);

export default function LandingInfo() {
  useLandingEasterEggs();
  return (
    // Selected text turns into a black redaction bar, like the hidden wallet
    <div className="flex flex-1 flex-col dark:bg-black selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <main
        className="min-h-screen bg-white dark:bg-black relative overflow-hidden"
        id="main-content"
      >
        <LandingSchema />
        {/* The page is one article: the hero is its header (with the h1), each block below a section with an h2 */}
        <article>
          <HeroSection />

          <VisibilityTable />
          <WalletDiagram />
          <HowItWorks />

          {/* The live form only makes sense once swaps work; before that the waitlist is the action */}
          {SWAPS_OPEN && (
            <section
              aria-labelledby="swap-demo-heading"
              className="w-full px-4 py-14 text-black sm:px-6 md:py-24 dark:text-white"
            >
              <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
                <div>
                  <h2
                    id="swap-demo-heading"
                    className="text-4xl leading-tight font-bold tracking-[-1px] md:text-5xl"
                  >
                    Try it here
                  </h2>
                  <p className="mt-4 leading-relaxed text-black/65 dark:text-white/65">
                    The same swap form as in the app. Connect a wallet to swap.
                  </p>
                </div>
                <div className="relative z-20 min-w-0">
                  <Suspense fallback={<SwapSkeleton />}>
                    <TokenProvider>
                      <SwapSection />
                    </TokenProvider>
                  </Suspense>
                </div>
              </div>
            </section>
          )}

          <Faq />
          <ClosingCta />
        </article>
      </main>
    </div>
  );
}
