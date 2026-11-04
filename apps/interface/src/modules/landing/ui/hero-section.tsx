import Image from "#/components/Image.js";
import { SWAPS_OPEN } from "../launch-state.js";
import { AnimatedDino } from "./animated-dino.js";
import { CtaLinks } from "./cta-links.js";
import { Pill } from "./pill.js";
import { WaitlistForm } from "./waitlist-form.js";

/** What the dino says when clicked. */
const DINO_LINE = SWAPS_OPEN ? "Go on, swap." : "Not yet.";

export default function HeroSection() {
  return (
    <header className="relative w-full overflow-hidden px-4 pt-12 pb-16 text-black sm:px-6 md:pt-20 md:pb-24 dark:text-white">
      {/* Dot grid, as on the rest of nemi.fi */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#0000001a_1.5px,transparent_1.5px)] bg-[size:28px_28px] dark:bg-[radial-gradient(#ffffff1a_1.5px,transparent_1.5px)]"
        aria-hidden="true"
      />

      {/* Two faint puzzle pieces cut off by the page edges, as on the old nemi.fi. They are CSS
          backgrounds, not <img>, so only content images are in the HTML */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden="true"
      >
        <div className="absolute top-1/3 -left-24 aspect-[375/501] w-44 bg-[url(/images/puzzle/green1.svg)] bg-contain bg-no-repeat opacity-[0.12] dark:opacity-20" />
        <div className="absolute -right-16 bottom-6 aspect-[276/218] w-40 bg-[url(/images/puzzle/blue.svg)] bg-contain bg-no-repeat opacity-[0.14] dark:opacity-20" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        {/* No entrance animation here: the heading is the largest paint, it should show at once */}
        <div>
          <Pill color="green" className="text-xs tracking-wider uppercase">
            {SWAPS_OPEN ? "Live on Aztec" : "Deployed on Aztec"}
          </Pill>
          <h1
            id="hero-heading"
            className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-[-1.5px] sm:text-6xl sm:tracking-[-2px] xl:text-7xl"
          >
            Private swaps on Aztec.
            <br />
            Nobody sees your <RedactedWord>wallet</RedactedWord>.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-black/65 dark:text-white/65">
            Swap tokens without tying the trade to your address.{" "}
            <span className="font-semibold text-black dark:text-white">
              Your wallet stays out of sight.
            </span>
          </p>

          <CtaLinks className="mt-9" besideForm />

          {SWAPS_OPEN && (
            <p className="mt-5 text-sm text-black/60 dark:text-white/60">
              Alpha on Aztec. Only swap what you can afford to lose.
            </p>
          )}
        </div>

        {SWAPS_OPEN ? <StandingDino /> : <WaitlistForm />}
      </div>
    </header>
  );
}

/**
 * A word in the headline that a black bar wipes over once on load, like a redaction, before it
 * settles into a soft grey highlight. Without motion only the highlight shows.
 */
function RedactedWord({ children }: { children: string }) {
  return (
    <span className="relative ml-[0.14em] inline-block [--redact-ink:#000] [--redact-paper:#fff] [--redact-soft:rgb(0_0_0/0.07)] dark:[--redact-ink:#fff] dark:[--redact-paper:#000] dark:[--redact-soft:rgb(255_255_255/0.12)]">
      <span
        className="absolute inset-x-[-0.1em] top-[0.1em] bottom-[-0.02em] origin-left animate-redact-bar rounded-[0.14em] bg-(--redact-soft) motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="relative animate-redact-text motion-reduce:animate-none">
        {children}
      </span>
    </span>
  );
}

/** After launch, when there is no waitlist: the hooded dino on its own, standing on the brand puzzle pieces. */
function StandingDino() {
  return (
    <div className="relative mx-auto flex w-full max-w-sm items-end justify-center pt-16 animate-in fade-in zoom-in-95 duration-700 lg:max-w-md">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/puzzle/orange.svg"
          alt=""
          width={250}
          height={201}
          className="absolute top-0 right-0 w-40 sm:w-52"
        />
        <Image
          src="/images/puzzle/pink.svg"
          alt=""
          width={250}
          height={200}
          className="absolute bottom-0 left-0 w-36 sm:w-48"
        />
      </div>
      <AnimatedDino
        line={DINO_LINE}
        sizes="(min-width: 640px) 208px, 160px"
        className="w-40 sm:w-52"
      />
    </div>
  );
}
