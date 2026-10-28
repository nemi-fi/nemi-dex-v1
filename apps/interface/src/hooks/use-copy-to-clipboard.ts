import { useCallback, useState } from "react";

/**
 * Copy text to the clipboard and expose a transient `copied` flag that auto-resets, so a button
 * can show a "copied!" state without every call site re-implementing the timer.
 */
export function useCopyToClipboard({
  resetMs = 2000,
}: { resetMs?: number } = {}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
