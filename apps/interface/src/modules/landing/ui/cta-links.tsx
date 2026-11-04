import { cn } from "#/lib/utils.js";
import { SiTelegram } from "@icons-pack/react-simple-icons";
import { appInfo } from "@nemi-fi/utils/appInfo";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { SWAPS_OPEN, WAITLIST_URL } from "../launch-state.js";

/**
 * "Open the DEX" as the site's black pill button, Telegram as a quieter link next to it.
 * Until {@link SWAPS_OPEN}, the pill is "Join the waitlist", which opens the Tally waitlist form in
 * a new tab, with an "opening soon" note beside it.
 */
export function CtaLinks({
  className,
  besideForm = false,
}: {
  className?: string;
  /** In the hero the form sits right next to it on desktop, so the waitlist pill only shows on phones. */
  besideForm?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6",
        className,
      )}
    >
      {SWAPS_OPEN ? (
        <>
          <Link
            to="/swap"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-base font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Open the DEX
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            to={appInfo.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 text-base font-medium text-black/75 underline decoration-black/25 decoration-1 underline-offset-4 transition-colors hover:text-black hover:decoration-black focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none sm:h-auto dark:text-white/75 dark:decoration-white/30 dark:hover:text-white"
          >
            <SiTelegram size={16} aria-hidden="true" />
            Ask in Telegram
          </Link>
        </>
      ) : (
        <>
          <a
            href={WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-base font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-black dark:hover:bg-gray-200",
              besideForm && "lg:hidden",
            )}
          >
            Join the waitlist
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
          <span className="inline-flex items-center justify-center gap-2 text-sm font-medium text-black/55 dark:text-white/55">
            <span
              className="size-2 animate-pulse rounded-full bg-nemi-yellow motion-reduce:animate-none"
              aria-hidden="true"
            />
            {besideForm
              ? "Swaps open once ETH is supported on Aztec"
              : "Swaps opening soon"}
          </span>
        </>
      )}
    </div>
  );
}

/** Quiet outlined "Join the waitlist" for the navbar (opens the Tally form), in place of the wallet button before launch. */
export function WaitlistNavButton() {
  return (
    <a
      href={WAITLIST_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-full items-center justify-center rounded-full border border-black/20 px-4 text-sm font-semibold text-black transition-colors hover:border-black/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none md:w-auto dark:border-white/25 dark:text-white dark:hover:border-white/60"
    >
      Join the waitlist
    </a>
  );
}
