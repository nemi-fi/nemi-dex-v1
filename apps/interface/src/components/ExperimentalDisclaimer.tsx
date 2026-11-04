import { WarningIcon } from "@phosphor-icons/react";

/** Warning shown at the top of forms that send transactions. */
export function ExperimentalDisclaimer() {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>Nemi is experimental software. Use at your own risk.</p>
    </div>
  );
}
