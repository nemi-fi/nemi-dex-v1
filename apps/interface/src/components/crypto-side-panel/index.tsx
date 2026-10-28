"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#/components/ui/tabs.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AssetList, AssetSkeleton } from "./components/AssetList.js";
import { TransactionList } from "./components/TransactionList.js";
import { WalletHeader } from "./components/WalletHeader.js";

interface CryptoSidePanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The element that opens the panel */
  children?: React.ReactNode;
}

const TABS = [
  { value: "assets", label: "Assets", content: <AssetList /> },
  { value: "history", label: "History", content: <TransactionList /> },
];

/** Fallback for when the slide-in animation never fires `animationend` (e.g. animations disabled). */
const SLIDE_IN_MS = 600;

export function CryptoSidePanel({
  isOpen,
  onOpenChange,
  children,
}: CryptoSidePanelProps) {
  // Mounting the balance and history views starts a private-balance query per
  // token, which runs PXE simulations on the main thread. Doing that while the
  // panel slides in makes the animation stutter, so show skeletons until it lands.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), SLIDE_IN_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="flex h-full w-full flex-col overflow-hidden border-l-0 p-0 focus:outline-none sm:max-w-md sm:border-l"
        aria-label="Crypto wallet panel"
        onAnimationEnd={(e) => {
          if (isOpen && e.target === e.currentTarget) setSettled(true);
        }}
      >
        <SheetHeader className="flex-shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5" aria-hidden="true" />
            Account
          </SheetTitle>
        </SheetHeader>

        <div className="flex-shrink-0 border-b px-4 py-4">
          {settled ? (
            <WalletHeader />
          ) : (
            <Skeleton className="h-[212px] w-full rounded-xl" />
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs defaultValue="assets" className="flex h-full flex-col">
            <div className="flex-shrink-0 px-6 pb-2 pt-4">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-lg bg-muted p-1 dark:bg-neutral-900/60">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-md text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/10 dark:text-muted-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-neutral-600 dark:data-[state=active]:text-white dark:data-[state=active]:ring-white/15"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {TABS.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="h-full overflow-y-auto"
                >
                  <div className="px-6 pb-6">
                    {settled ? (
                      tab.content
                    ) : (
                      <>
                        <AssetSkeleton />
                        <AssetSkeleton />
                        <AssetSkeleton />
                      </>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
