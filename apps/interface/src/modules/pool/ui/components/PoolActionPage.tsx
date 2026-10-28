import { TokenProvider } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import { useMemo, type ComponentType } from "react";
import { useSearchParams } from "react-router";

/**
 * Route body for /pool/add-liquidity and /pool/remove-liquidity. `?tokenA=…&tokenB=…`
 * preselects the pair and locks token selection.
 */
export function PoolActionPage({
  section: Section,
}: {
  section: ComponentType<{ disableTokenSelection?: boolean }>;
}) {
  const [searchParams] = useSearchParams();
  const tokenA = searchParams.get("tokenA") || undefined;
  const tokenB = searchParams.get("tokenB") || undefined;
  // TokenProvider re-selects tokens whenever this object changes, so keep it stable
  const initialTokenAddresses = useMemo(
    () => ({ tokenA, tokenB }),
    [tokenA, tokenB],
  );

  return (
    <main className="container mx-auto max-w-7xl flex-grow px-4 py-6 md:px-6 md:py-10">
      <TokenProvider initialTokenAddresses={initialTokenAddresses}>
        <Section disableTokenSelection={Boolean(tokenA && tokenB)} />
      </TokenProvider>
    </main>
  );
}
