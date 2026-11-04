import type { ReactElement } from "react";
import { appInfo } from "@nemi-fi/utils/appInfo";
import { SWAPS_OPEN } from "../launch-state.js";
import { QUESTIONS } from "./faq.js";
import { WALLET_DIAGRAM } from "./wallet-diagram.js";

const SITE = "https://nemi.fi";

/**
 * schema.org structured data for the landing, so search engines can show Nemi as an organisation
 * with its profiles, the site itself, the page with its diagram and share image, the swap app, and the FAQ. The FAQ text is the same list the
 * page renders, so the two never drift apart.
 */
const GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Nemi",
      url: SITE,
      logo: `${SITE}/icon1.png`,
      sameAs: [
        "https://x.com/nemi_fi",
        appInfo.telegramLink,
        // "https://docs.nemi.fi", (docs are offline for now)
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Nemi",
      url: SITE,
      inLanguage: "en",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE}/#webpage`,
      url: `${SITE}/`,
      name: "Nemi · token swap on Aztec that hides your wallet",
      inLanguage: "en",
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#app` },
      primaryImageOfPage: { "@id": `${SITE}/#wallet-diagram` },
      image: [
        { "@id": `${SITE}/#wallet-diagram` },
        { "@id": `${SITE}/#share-image` },
      ],
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE}/#wallet-diagram`,
      contentUrl: WALLET_DIAGRAM.files.map((path) => `${SITE}${path}`),
      url: `${SITE}${WALLET_DIAGRAM.src}`,
      width: WALLET_DIAGRAM.width,
      height: WALLET_DIAGRAM.height,
      name: "What one swap reveals: public chain vs Nemi",
      description: WALLET_DIAGRAM.alt,
      caption: WALLET_DIAGRAM.caption,
      encodingFormat: "image/jpeg",
      creator: { "@id": `${SITE}/#organization` },
      creditText: "Nemi",
      copyrightNotice: "© 2026 Nemi",
      copyrightHolder: { "@id": `${SITE}/#organization` },
      acquireLicensePage: `${SITE}/terms-of-service`,
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE}/#share-image`,
      contentUrl: `${SITE}/images/landing/nemi-dex-share.png`,
      width: 1200,
      height: 630,
      name: "Private swaps on Aztec. Nobody sees your wallet.",
      encodingFormat: "image/png",
      creator: { "@id": `${SITE}/#organization` },
      creditText: "Nemi",
      copyrightNotice: "© 2026 Nemi",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE}/#app`,
      name: "Nemi DEX",
      url: `${SITE}/swap`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any (web browser)",
      description:
        "Private token swaps on Aztec, an Ethereum L2 built for privacy. The wallet that made a swap stays hidden.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      releaseNotes: SWAPS_OPEN
        ? "Alpha on Aztec mainnet."
        : "Deployed on Aztec mainnet. Swaps open once bridged tokens like ETH are supported.",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: QUESTIONS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
} as const;

/** Renders {@link GRAPH} as a JSON-LD script tag; place it once on the landing. */
export function LandingSchema(): ReactElement {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: no user input, and "<" is escaped below
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(GRAPH).replace(/</g, "\\u003c"),
      }}
    />
  );
}
