"use client";

import { SwapSection } from "@/modules/home/ui/components/swap-section";
import { TokenProvider } from "@/modules/home/ui/components/swap-section/TokenContext";

export default function SwapPage() {
  return (
    <main className="flex-1 flex items-start justify-center p-6 md:p-10">
      <div className="w-full max-w-xl mx-auto">
        <TokenProvider>
          <SwapSection />
        </TokenProvider>
      </div>
    </main>
  );
}
