"use client";

import { TokenProvider } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import { clientOnly } from "#/lib/client-only.js";
import { Skeleton } from "#/components/ui/skeleton.js";

// Dynamically import PoolSection with improved loading state
const PoolSection = clientOnly(
  () =>
    import("#/modules/pool/ui/components/pool-section/PoolSection.js").then(
      (mod) => mod.PoolSection,
    ),
  { loading: () => <PoolLoadingFallback /> },
);

// Custom loading fallback with minimum display time to prevent flashing
const PoolLoadingFallback = () => {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-muted/30 rounded-xl p-5">
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-9 w-full" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default function PoolPage() {
  return (
    <main className="flex-grow container px-4 md:px-6 py-6 md:py-10 mx-auto max-w-7xl">
      <div className="flex flex-col gap-8 h-full">
        <TokenProvider>
          <PoolSection />
        </TokenProvider>
      </div>
    </main>
  );
}
