import { useCallback, useState } from "react";

/** Which side of a form the token selector is picking for. */
export type TokenSide = "pay" | "receive";

/** Open/closed state for the token selector shared by the swap and liquidity forms. */
export function useTokenSelectorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState<TokenSide>("pay");

  const open = useCallback((nextSide: TokenSide) => {
    setSide(nextSide);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, side, open, close };
}
