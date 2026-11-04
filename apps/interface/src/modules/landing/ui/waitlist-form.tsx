import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  RocketLaunchIcon,
} from "@phosphor-icons/react";
import {
  NOT_YET_LINES,
  WAITLIST_ANCHOR,
  WAITLIST_URL,
} from "../launch-state.js";
import { AnimatedDino } from "./animated-dino.js";

/** The three steps the form promises, shown above the button so people know why they sign up. */
const STEPS = [
  {
    icon: EnvelopeSimpleIcon,
    title: "Leave your email",
    color: "bg-nemi-pink",
  },
  {
    icon: RocketLaunchIcon,
    title: "Swaps open on Aztec",
    color: "bg-nemi-orange",
  },
  {
    icon: PaperPlaneTiltIcon,
    title: "We email you once",
    color: "bg-nemi-blue",
  },
] as const;

/**
 * The DEX waitlist card in the hero. Sign-ups live in a Tally form ({@link WAITLIST_URL}): it
 * opens in a new tab, because the site's cross-origin isolation (needed for in-browser proving)
 * blocks embedding it, and a direct POST to Tally isn't a public API. The form asks for the email,
 * an optional X or Telegram handle and what they would swap first.
 */
export function WaitlistForm() {
  return (
    <div
      id={WAITLIST_ANCHOR}
      className="relative mx-auto w-full max-w-md scroll-mt-24 animate-in fade-in zoom-in-95 duration-700 lg:max-w-none"
    >
      {/* Small dino on the card's corner */}
      <AnimatedDino
        line={NOT_YET_LINES}
        sizes="96px"
        className="absolute -top-14 right-6 z-0 w-20 sm:w-24"
      />

      <div className="relative z-10 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] sm:p-8 dark:border-white/10 dark:bg-neutral-900">
        <h2 className="text-xl font-bold">NEMI DEX waitlist</h2>

        {/* What signing up means, in three steps */}
        <ol
          className="mt-6 grid grid-cols-3 gap-2"
          aria-label="What happens next"
        >
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              {i > 0 && (
                <span
                  className="absolute top-5 right-1/2 w-full border-t-2 border-dashed border-black/15 dark:border-white/20"
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex size-10 items-center justify-center rounded-full text-white ${step.color}`}
                aria-hidden="true"
              >
                <step.icon className="size-5" />
              </span>
              <span className="mt-2 text-xs leading-snug font-medium text-black/70 dark:text-white/70">
                {step.title}
              </span>
            </li>
          ))}
        </ol>

        <a
          href={WAITLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-base font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Join the waitlist
          <ArrowUpRightIcon
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
          <span className="sr-only">(opens a form in a new tab)</span>
        </a>
        <p className="mt-3 text-xs text-black/60 dark:text-white/60">
          One email, on the day swaps open. Nothing else.
        </p>
      </div>
    </div>
  );
}
