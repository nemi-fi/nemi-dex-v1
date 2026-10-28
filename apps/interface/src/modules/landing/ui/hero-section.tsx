import Image from "#/components/Image.js";
import { PrivacyInAction } from "./privacy-in-action.js";

const PUZZLE_PIECES = [
  {
    src: "/images/puzzle/blue.svg",
    size: 180,
    className: "top-[-8%] left-1/2 animate-float-blue",
  },
  {
    src: "/images/puzzle/green.svg",
    size: 160,
    className: "top-[-6%] right-[4%] animate-float-green",
  },
  {
    src: "/images/puzzle/green1.svg",
    size: 140,
    className: "top-[35%] left-[-4%] animate-float-green1",
  },
  {
    src: "/images/puzzle/pink.svg",
    size: 150,
    className: "bottom-[-4%] left-[15%] animate-float-pink",
  },
];

export default function HeroSection() {
  return (
    <section
      className="relative flex min-h-[100vh] w-full flex-col items-center justify-center overflow-hidden py-4 text-black sm:py-8 md:py-12 lg:py-16 dark:text-white"
      aria-labelledby="hero-heading"
    >
      {/* Background: dot grid and floating puzzle pieces */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#0000000d_1px,transparent_1px)] bg-[size:25px_25px] opacity-30 dark:bg-[radial-gradient(#ffffff0d_1px,transparent_1px)]" />
        {PUZZLE_PIECES.map((piece) => (
          <div
            key={piece.src}
            className={`absolute opacity-25 blur-[0.5px] motion-reduce:animate-none ${piece.className}`}
          >
            <Image
              src={piece.src}
              width={piece.size}
              height={piece.size}
              alt=""
              style={{ maxWidth: "none" }}
            />
          </div>
        ))}
      </div>

      <div className="z-10 mx-auto mb-4 w-full max-w-3xl text-center animate-in fade-in slide-in-from-bottom-6 duration-700 sm:mb-6 md:mb-8">
        <h1
          id="hero-heading"
          className="mb-3 text-2xl leading-tight font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
        >
          Private DEX
        </h1>
        <p className="mx-auto max-w-2xl px-4 text-xs leading-relaxed text-black/85 sm:px-6 sm:text-sm md:text-base lg:text-lg dark:text-white/85">
          Nemi is a revolutionary DEX, protecting traders from strategy leaks,
          copy trading, and doxxing while unlocking trillions in sidelined
          TradFi capital.
        </p>
      </div>

      <div className="relative z-10 mx-auto mb-8 w-full max-w-3xl px-3 sm:mb-12 sm:px-4 md:px-6">
        <PrivacyInAction />
      </div>
    </section>
  );
}
