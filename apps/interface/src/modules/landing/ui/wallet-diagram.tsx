// import { Link } from "react-router"; // for the docs link, offline for now

const BASE = "/images/landing/what-one-swap-reveals";

/** The infographic in its two layouts; both are listed in the page's ImageObject. */
export const WALLET_DIAGRAM = {
  src: `${BASE}-wide.jpg`,
  width: 3840,
  height: 2160,
  files: [`${BASE}-wide.jpg`, `${BASE}-phone.jpg`],
  alt: "Four swaps on a public chain all link to one address; on Nemi the same swaps hide the wallet.",
  caption:
    "On a public chain one address ties your balance and every swap together. On Nemi the wallet behind each swap stays hidden.",
} as const;

const srcSet = (kind: "wide" | "phone", widths: readonly number[]): string =>
  widths.map((w) => `${BASE}-${kind}-${w}w.webp ${w}w`).join(", ");

/**
 * Why a hidden wallet matters, shown as two block-explorer views of the same four swaps. Wide
 * screens get the side-by-side infographic, phones the stacked one (only the visible one loads).
 * JPEG originals in src, WebP previews in srcset, no figure or picture.
 */
export default function WalletDiagram() {
  return (
    <section
      className="relative w-full px-4 py-14 text-black sm:px-6 md:py-24 dark:text-white"
      aria-labelledby="wallet-diagram-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
          <h2
            id="wallet-diagram-heading"
            className="text-4xl leading-tight font-bold tracking-[-1px] md:text-5xl"
          >
            Why the wallet matters
          </h2>
          <div className="space-y-4 leading-relaxed text-black/65 dark:text-white/65">
            <p>
              On a public chain every swap carries the address that made it.
              Look up that address and you see its balance, every trade and when
              it happened.
            </p>
            <p>
              On Nemi the wallet that made a swap is not shown, so there is no
              address to line your swaps up under.
              {/* Docs are offline for now; bring the link back when docs.nemi.fi is up:
              {" "}The details are in{" "}
              <Link
                to="https://docs.nemi.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-black underline decoration-black/25 underline-offset-4 hover:decoration-black dark:text-white dark:decoration-white/30 dark:hover:decoration-white"
              >
                the Nemi docs
              </Link>
              . */}
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 md:mt-14 dark:border-white/10">
          <img
            src={WALLET_DIAGRAM.src}
            srcSet={srcSet("wide", [960, 1440, 1920])}
            sizes="(min-width: 1024px) 1024px, 100vw"
            width={WALLET_DIAGRAM.width}
            height={WALLET_DIAGRAM.height}
            alt={WALLET_DIAGRAM.alt}
            loading="lazy"
            decoding="async"
            className="hidden h-auto w-full md:block"
          />
          <img
            src={`${BASE}-phone.jpg`}
            srcSet={srcSet("phone", [480, 720, 1080])}
            sizes="calc(100vw - 2rem)"
            width={2160}
            height={3828}
            alt={WALLET_DIAGRAM.alt}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full md:hidden"
          />
        </div>
      </div>
    </section>
  );
}
