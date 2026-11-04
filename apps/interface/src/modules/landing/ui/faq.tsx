import { PlusIcon } from "@phosphor-icons/react";
import { SWAPS_OPEN } from "../launch-state.js";

/**
 * Every answer describes the alpha as it ships; no claims about audits, fees or regions.
 * Also published as FAQPage structured data by {@link LandingSchema}.
 */
export const QUESTIONS: readonly { readonly q: string; readonly a: string }[] =
  [
    {
      q: "What is Nemi?",
      a: "Private token swaps on Aztec, an Ethereum L2 built for privacy. Nobody sees which wallet made a swap.",
    },
    {
      q: SWAPS_OPEN ? "Is it live with real funds?" : "When can I swap?",
      a: SWAPS_OPEN
        ? "Yes, as an alpha on Aztec mainnet. It is experimental software and may have bugs. Only swap what you can afford to lose."
        : "The contracts are deployed on Aztec mainnet. Swaps open once bridged tokens like ETH are supported; the date is announced in the Telegram first. It will be an alpha, so only swap what you can afford to lose.",
    },
    {
      q: "Who holds my funds?",
      a: "You do. Nemi is self-custodial.",
    },
    {
      q: "Why does a swap take a while?",
      a: "Before the swap is sent, your device builds a zero-knowledge proof. This usually takes less than a minute.",
    },
    {
      q: "Which tokens can I swap?",
      a: "The token list in the app shows every pair that has liquidity right now.",
    },
    {
      q: "How do I check that my swap went through?",
      a: "Every swap has a transaction hash you can look up on Aztec.",
    },
  ];

export default function Faq() {
  return (
    <section
      className="relative w-full px-4 py-14 text-black sm:px-6 md:py-24 dark:text-white"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2
          id="faq-heading"
          className="text-4xl leading-tight font-bold tracking-[-1px] md:text-5xl"
        >
          Questions
        </h2>
        <div className="border-t border-black/15 dark:border-white/15">
          {QUESTIONS.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-black/15 dark:border-white/15"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 focus-visible:outline-2 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
                {/* Each question is an h3 under the section's h2 */}
                <h3 className="text-lg font-medium">{q}</h3>
                <PlusIcon
                  className="size-5 shrink-0 text-black/60 transition-transform group-open:rotate-45 dark:text-white/60"
                  aria-hidden="true"
                />
              </summary>
              <p className="-mt-1 pb-5 leading-relaxed text-black/65 dark:text-white/65">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
