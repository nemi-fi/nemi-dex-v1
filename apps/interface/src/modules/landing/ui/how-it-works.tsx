import { cn } from "#/lib/utils.js";

// Numerals from the original nemi.fi "Benefits" badges, with their view boxes.
const NUMBER_PATHS = [
  "M12.9866 30.5987C12.9866 32.2556 14.3298 33.5988 15.9866 33.5988H16.5986C18.1914 33.5988 19.4826 34.89 19.4826 36.4827C19.4826 38.0755 18.1914 39.3667 16.5986 39.3667H3.55063C1.95784 39.3667 0.666626 38.0755 0.666626 36.4827C0.666626 34.89 1.95784 33.5988 3.55063 33.5988H4.16263C5.81948 33.5988 7.16263 32.2556 7.16263 30.5987V8.93475C7.16263 7.27789 5.81948 5.93475 4.16263 5.93475H3.55063C1.95784 5.93475 0.666626 4.64354 0.666626 3.05075C0.666626 1.45796 1.95784 0.166748 3.55063 0.166748H7.16263H9.98663C11.6435 0.166748 12.9866 1.50989 12.9866 3.16675V30.5987Z",
  "M7.80543 29.9429C7.63147 30.1918 7.46866 30.4671 7.31795 30.7696C6.49756 32.4161 7.99487 34.1143 9.83449 34.1143H20.9259C22.5512 34.1143 23.8688 35.4318 23.8688 37.0571C23.8688 38.6824 22.5512 40 20.9259 40H2.99774C1.34213 40 -0.0142574 38.6553 0.0833818 37.0026C0.357717 32.359 1.31559 28.983 3.0543 26.5143C5.03394 23.6571 7.69231 22.5143 10.0679 21.4857C10.8032 21.2 11.4819 20.9143 12.1041 20.5714C16.9683 18.1143 19.1176 15.6571 19.1176 12.6286C19.1176 8.91429 16.1765 5.94286 12.5 5.94286C9.87647 5.94286 7.60945 7.50364 6.56022 9.77682C5.87949 11.2517 4.6221 12.6286 2.99774 12.6286C1.37337 12.6286 0.0215663 11.2939 0.391753 9.71224C1.69468 4.14549 6.64142 0 12.5 0C19.4005 0 25 5.65714 25 12.6286C25 20.6857 17.2511 24.5714 14.7059 25.8857C13.914 26.2857 13.1222 26.6286 12.3303 26.9714C10.4072 27.7714 8.88009 28.4571 7.80543 29.9429Z",
  "M22.5182 12.5214C21.2416 13.2164 21.1322 15.0222 22.0905 16.1151C25.2275 19.6925 25.0552 23.6843 24.9612 26.2089C24.9612 26.6667 24.9047 27.0672 24.9047 27.3534C24.9047 30.7296 23.6058 33.877 21.2339 36.2804C18.9185 38.6838 15.756 40 12.4806 40C5.59085 40 0 34.3348 0 27.3534C0 27.1472 0.125996 26.9642 0.321673 26.8992C1.54145 26.494 5.81585 25.2156 5.87322 27.1817C5.87517 27.2487 5.87237 27.2863 5.87322 27.3534C5.9197 31.0266 8.80982 34.0486 12.4806 34.0486C14.2313 34.0486 15.869 33.3619 17.1114 32.103C18.3538 30.8441 19.0315 29.1273 19.0315 27.3534C19.0315 26.8956 19.088 26.4378 19.088 25.98C19.2009 23.2332 19.3138 20.9442 16.3208 18.7697C14.0618 17.1674 10.8993 18.7697 7.90625 20.5436C7.62801 20.7128 7.36804 20.8696 7.12035 21.0121C6.36686 21.4454 5.47652 21.0228 5.19554 20.2003L4.19081 17.7428C3.83038 16.8612 4.19006 15.8496 5.02612 15.3934C5.92969 14.8212 7.05915 14.1917 8.35804 13.6195L12.2385 11.5378C14.9872 10.0632 13.9395 5.89414 10.8203 5.89414H2.94707C1.31945 5.89414 0 4.57469 0 2.94707C0 1.31945 1.31945 0 2.94707 0H20.6587C22.2864 0 23.6058 1.31945 23.6058 2.94707V5.8659C23.6058 5.88149 23.5932 5.89414 23.5776 5.89414C23.562 5.89414 23.5493 5.90678 23.5493 5.92237V10.7859C23.5493 11.5095 23.1538 12.1753 22.5182 12.5214Z",
];

const NUMBER_VIEWBOXES = ["0 0 20 40", "0 0 25 40", "0 0 25 40"];

/** Badge colours: pink, orange, blue, as on the original site. */
const BADGE_COLORS = ["bg-nemi-pink", "bg-nemi-orange", "bg-nemi-blue"];

const STEPS = [
  {
    title: "Connect a wallet",
    text: "Use the Aztec wallet you already have, or let Nemi set one up in the browser. The keys stay with you.",
  },
  {
    title: "Swap",
    text: "Pick the tokens and the amount. A zero-knowledge proof is built on your device before anything is sent.",
  },
  {
    title: "Get your tokens",
    text: "They arrive in your wallet. The transaction hash is on Aztec if you want to look it up.",
  },
];

/** Three plain steps of a swap on Nemi; every line describes what the app does today. */
export default function HowItWorks() {
  return (
    <section
      className="relative w-full px-4 py-14 text-black sm:px-6 md:py-24 dark:text-white"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2
          id="how-it-works-heading"
          className="text-4xl leading-tight font-bold tracking-[-1px] md:text-5xl"
        >
          How a swap works
        </h2>
        <ol className="border-t border-black/15 dark:border-white/15">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="grid grid-cols-[3rem_1fr] items-start gap-x-5 border-b border-black/15 py-5 dark:border-white/15"
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  BADGE_COLORS[i],
                )}
                aria-hidden="true"
              >
                <svg viewBox={NUMBER_VIEWBOXES[i]} className="h-6 w-auto">
                  <path d={NUMBER_PATHS[i]} fill="white" />
                </svg>
              </span>
              <div>
                <h3 className="text-xl leading-7 font-bold">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-black/65 dark:text-white/65">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
