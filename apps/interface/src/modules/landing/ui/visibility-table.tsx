import { HiddenWallet } from "./hidden-wallet.js";

type Row = { field: string; value: string; hiddenOnNemi: boolean };

/** One example swap, field by field. The hidden wallet is a solid bar, as on the hero card. */
const ROWS: Row[] = [
  { field: "Wallet", value: "0x7a3f…c21e", hiddenOnNemi: true },
  { field: "Tokens", value: "ETH → DAI", hiddenOnNemi: false },
  { field: "Amounts", value: "1 → 2,267", hiddenOnNemi: false },
];

function Value({ text, hidden }: { text: string; hidden: boolean }) {
  if (!hidden) {
    return <span className="text-black dark:text-white">{text}</span>;
  }
  return (
    <>
      <HiddenWallet className="w-24 sm:w-32" />
      {/* The bar has no text of its own; this keeps "hidden" in the table's HTML */}
      <span className="sr-only">Hidden</span>
    </>
  );
}

/** Field-by-field comparison: only the wallet is hidden on Nemi. */
export default function VisibilityTable() {
  return (
    <section
      className="relative w-full px-4 py-14 text-black sm:px-6 md:py-24 dark:text-white"
      aria-labelledby="visibility-heading"
    >
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        <div>
          <h2
            id="visibility-heading"
            className="text-4xl leading-tight font-bold tracking-[-1px] md:text-5xl"
          >
            What anyone can see
          </h2>
          <p className="mt-4 leading-relaxed text-black/65 dark:text-white/65">
            On a public chain, every swap points straight back to the wallet
            that made it. On Nemi that link is gone.
          </p>
        </div>
        <table className="w-full table-fixed border-t border-black/15 text-left dark:border-white/15">
          <caption className="sr-only">
            One swap, field by field, on a public chain and on Nemi
          </caption>
          <thead>
            <tr className="border-b border-black/15 font-mono text-[11px] tracking-wider text-black/60 uppercase dark:border-white/15 dark:text-white/60">
              <th scope="col" className="w-[34%] py-3 pr-2 font-normal">
                One swap
              </th>
              <th scope="col" className="py-3 pr-2 font-normal">
                Public chain
              </th>
              <th scope="col" className="py-3 font-normal">
                Nemi
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs sm:text-sm">
            {ROWS.map((row) => (
              <tr
                key={row.field}
                className="border-b border-black/10 dark:border-white/10"
              >
                <th
                  scope="row"
                  className="py-3.5 pr-2 font-sans text-sm font-medium sm:text-base"
                >
                  {row.field}
                </th>
                <td className="py-3.5 pr-2">
                  {row.hiddenOnNemi ? (
                    // Yellow marks the wallet, as in the hero's "which wallet" pill
                    <span className="rounded bg-nemi-yellow/60 px-1.5 py-0.5 text-black">
                      {row.value}
                    </span>
                  ) : (
                    <Value text={row.value} hidden={false} />
                  )}
                </td>
                <td className="py-3.5">
                  <Value text={row.value} hidden={row.hiddenOnNemi} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
