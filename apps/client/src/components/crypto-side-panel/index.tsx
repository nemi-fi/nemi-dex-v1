"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "@/hooks/use-account";
import { useSearchTerm } from "@/hooks/use-token-data";
import { Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssetList } from "./components/AssetList";
import { TransactionList } from "./components/TransactionList";
import { WalletHeader } from "./components/WalletHeader";

interface CryptoSidePanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  defaultTab?: string;
}

export function CryptoSidePanel({
  isOpen,
  onOpenChange,
  children,
  defaultTab = "assets",
}: CryptoSidePanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const prevOpenState = useRef(isOpen);
  const firstFocusableRef = useRef<HTMLInputElement>(null);

  const { searchQuery, setSearchQuery } = useSearchTerm();

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Focus management when opening the panel
  useEffect(() => {
    if (isOpen && !prevOpenState.current) {
      // Panel was just opened
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }
    prevOpenState.current = isOpen;
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange?.(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="w-full p-0 sm:max-w-md focus:outline-none border-l-0 sm:border-l flex flex-col h-full overflow-hidden"
        onKeyDown={handleKeyDown}
        aria-label="Crypto wallet panel"
      >
        {/* Fixed Header */}
        <SheetHeader className="border-b px-6 py-4 flex-shrink-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Wallet className="h-5 w-5" aria-hidden="true" />
            Account
          </SheetTitle>
        </SheetHeader>

        {/* Fixed Wallet Info */}
        <div className="px-4 py-4 border-b flex-shrink-0">
          <WalletHeader />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            defaultValue="assets"
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            {/* Fixed Tab List */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <TabsList className="w-full h-12 bg-muted/30 rounded-lg p-1 grid grid-cols-2">
                <TabsTrigger
                  value="assets"
                  className="text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 hover:bg-muted/50 data-[state=active]:hover:bg-background"
                >
                  Assets
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 hover:bg-muted/50 data-[state=active]:hover:bg-background"
                >
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="assets" className="h-full overflow-y-auto">
                <div className="px-6 pb-6">
                  <AssetList
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="h-full overflow-y-auto">
                <div className="px-6 pb-6">
                  <TransactionList />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
