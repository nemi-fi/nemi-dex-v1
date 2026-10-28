"use client";

import { SwapSection } from "#/modules/home/ui/components/swap-section/index.js";
import { TokenProvider } from "#/modules/home/ui/components/swap-section/TokenContext.js";

export default function SwapPage() {
  return (
    <main className="flex-1 flex items-start justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-xl mx-auto">
        <TokenProvider>
          <SwapSection />
        </TokenProvider>
      </div>
    </main>
  );
}
