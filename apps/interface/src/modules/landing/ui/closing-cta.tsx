import Image from "#/components/Image.js";
import { Link } from "react-router";
import { SWAPS_OPEN } from "../launch-state.js";
import { AnimatedDino } from "./animated-dino.js";
import { CtaLinks } from "./cta-links.js";
import { Pill } from "./pill.js";

/** Last screen before the footer: the hooded mascot, the main action again, and "Built on Aztec". */
export default function ClosingCta() {
  return (
    <section
      className="relative w-full px-4 pt-6 pb-16 text-black sm:px-6 md:pb-24 dark:text-white"
      aria-labelledby="closing-heading"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 overflow-hidden rounded-3xl border border-black/10 bg-gray-50 bg-[radial-gradient(#0000001a_1.5px,transparent_1.5px)] bg-[size:28px_28px] px-6 py-12 md:flex-row md:items-end md:gap-14 md:px-14 md:pt-16 md:pb-0 dark:border-white/10 dark:bg-neutral-900 dark:bg-[radial-gradient(#ffffff1a_1.5px,transparent_1.5px)]">
        <div className="order-1 text-center md:order-2 md:flex-1 md:pb-14 md:text-left">
          <h2
            id="closing-heading"
            className="text-4xl leading-[1.15] font-bold tracking-[-1px] md:text-5xl"
          >
            Nemi DEX is{" "}
            <Pill color="green">{SWAPS_OPEN ? "live" : "deployed"}</Pill> on
            Aztec
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-black/70 dark:text-white/70">
            {SWAPS_OPEN
              ? "Start with a small amount. Questions go to the Telegram."
              : "Swaps open soon. The first swap is announced in the Telegram."}
          </p>
          <CtaLinks className="mt-8 justify-center md:justify-start" />
          <Link
            to="https://aztec.network"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-3 text-sm text-black/55 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Built on
            {/* Both logos are rendered; CSS picks the one for the current theme */}
            <Image
              src="/images/aztec/aztec-logo-dark.svg"
              alt="Aztec"
              width={72}
              height={24}
              className="h-5 w-auto dark:hidden"
            />
            <Image
              src="/images/aztec/aztec-logo-light.svg"
              alt="Aztec"
              width={72}
              height={24}
              className="hidden h-5 w-auto dark:block"
            />
          </Link>
        </div>
        <AnimatedDino
          line={SWAPS_OPEN ? "Go on, swap." : "Not yet."}
          sizes="260px"
          bubbleSide="right"
          className="order-2 w-44 shrink-0 md:order-1 md:w-64"
        />
      </div>
    </section>
  );
}
