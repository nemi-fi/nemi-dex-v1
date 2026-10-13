"use client";

import { TokenProvider } from "@/modules/home/ui/components/swap-section/TokenContext";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

// Loading spinner component to reduce re-renders
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

// Full-page loading spinner
const FullPageLoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

// Dynamically import AddLiquiditySection with optimized loading state
const AddLiquiditySection = dynamic(
  () =>
    import("@/modules/pool/ui/components/add-liquidity/AddLiquiditySection").then(
      (mod) => mod.AddLiquiditySection,
    ),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
);

export default function AddLiquidityPage() {
  const searchParams = useSearchParams();

  // Memoize token addresses to prevent unnecessary re-renders
  const tokenAddresses = useMemo(
    () => ({
      tokenA: searchParams?.get("tokenA") || undefined,
      tokenB: searchParams?.get("tokenB") || undefined,
    }),
    [searchParams],
  );

  // Only update disableTokenSelection state when addresses change
  const [disableTokenSelection, setDisableTokenSelection] = useState(() =>
    Boolean(tokenAddresses.tokenA && tokenAddresses.tokenB),
  );

  // Memoize page state to prevent re-renders
  const [pageState, setPageState] = useState({
    isLoaded: false,
  });

  // Update token selection state only when addresses change
  useEffect(() => {
    setDisableTokenSelection(
      Boolean(tokenAddresses.tokenA && tokenAddresses.tokenB),
    );
  }, [tokenAddresses.tokenA, tokenAddresses.tokenB]);

  // Page load effect with cleanup
  useEffect(() => {
    let isMounted = true;

    const handlePageLoad = () => {
      if (!isMounted) return;
      // Delay setting loaded state slightly for smoother transitions
      setTimeout(() => {
        if (isMounted) {
          setPageState((prev) => ({ ...prev, isLoaded: true }));
        }
      }, 300);
    };

    // Setup page load handler
    if (document.readyState === "complete") {
      handlePageLoad();
    } else {
      window.addEventListener("load", handlePageLoad);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener("load", handlePageLoad);
    };
  }, []);

  // Memoize the content to reduce re-renders
  const pageContent = useMemo(
    () => (
      <main className="flex-grow container px-4 md:px-6 py-6 md:py-10 mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 h-full">
          <TokenProvider initialTokenAddresses={tokenAddresses}>
            <AddLiquiditySection
              disableTokenSelection={disableTokenSelection}
            />
          </TokenProvider>
        </div>
      </main>
    ),
    [tokenAddresses, disableTokenSelection],
  );

  return (
    <Suspense fallback={<FullPageLoadingSpinner />}>{pageContent}</Suspense>
  );
}
