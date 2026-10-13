"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsDevEnvironment } from "@/hooks/use-is-dev-environment";
import { lib } from "@/lib/sdk";
import { sutils } from "@nemi-fi/utils";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Globe,
  Landmark,
  Minus,
  Navigation,
  Plus,
  ShieldAlert,
  Terminal,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Define tab types
type TabType = "session" | "tokens" | "admin" | "nav";

export const DevModePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(1000);
  const [customToken, setCustomToken] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("session");
  const [currentChain, setCurrentChain] = useState<string>("");

  // Check if panel should be visible (only in dev mode)
  const isVisible = useIsDevEnvironment();

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Get current chain
    if (lib.aztec && lib.aztec.chain) {
      setCurrentChain(lib.aztec.chain.name);
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Simulate minting tokens
  const mintTokens = (amount: number, symbol = "ETH") => {
    console.log(`DEV: Minting ${amount} ${symbol}`);
    // Implementation would depend on your backend/SDK
  };

  // Adjust token amount
  const adjustAmount = (delta: number) => {
    setTokenAmount((prev) => {
      const newAmount = prev + delta;
      return newAmount < 100 ? 100 : newAmount > 10000 ? 10000 : newAmount;
    });
  };

  // Switch network
  const switchNetwork = (chainName: keyof typeof sutils.supportedAvmChains) => {
    if (lib.aztec && lib.aztec.reconnect) {
      lib.aztec.reconnect(chainName);
    }
  };

  // Define the tabs for mobile navigation
  const mobileTabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "session", label: "Session", icon: <ShieldAlert size={14} /> },
    { id: "tokens", label: "Tokens", icon: <Coins size={14} /> },
    { id: "admin", label: "Admin", icon: <Landmark size={14} /> },
    { id: "nav", label: "Nav", icon: <Navigation size={14} /> },
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* Trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed z-50 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
            isMobile ? "bottom-16 right-4 w-12 h-12" : "bottom-20 right-4 p-3"
          }`}
          aria-label="Open Developer Panel"
        >
          <Terminal size={isMobile ? 24 : 20} />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-xl border backdrop-blur-md rounded-lg overflow-hidden ${
            isMinimized
              ? "w-auto h-auto"
              : isMobile
                ? "w-[94%] max-w-[370px] max-h-[80vh]"
                : "w-80 max-h-[85vh]"
          } ${
            isMobile ? "bottom-16 right-4 left-4 mx-auto" : "bottom-20 right-4"
          } border-yellow-500/30`}
        >
          {/* Header */}
          <div className="bg-yellow-500 text-black px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={isMobile ? 18 : 16} />
              <span className="font-medium">DEV PANEL</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-yellow-600 rounded-md transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUp size={isMobile ? 20 : 16} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 16} />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-yellow-600 rounded-md transition-colors"
                aria-label="Close"
              >
                <X size={isMobile ? 20 : 16} />
              </button>
            </div>
          </div>

          {/* Body (only visible when not minimized) */}
          {!isMinimized && (
            <div className="bg-background/90 overflow-hidden">
              {/* Mobile Tabs */}
              {isMobile && (
                <div className="flex border-b overflow-x-auto">
                  {mobileTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`flex-1 py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                        activeTab === tab.id
                          ? "bg-muted border-b-2 border-yellow-500"
                          : ""
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <div
                className="p-4 overflow-y-auto"
                style={{ maxHeight: isMobile ? "calc(80vh - 120px)" : "75vh" }}
              >
                <div className="space-y-5">
                  {/* Token minting - always visible on desktop, only when tab is active on mobile */}
                  {(!isMobile || activeTab === "tokens") && (
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase font-medium text-muted-foreground flex items-center gap-1.5">
                        <Coins size={14} />
                        Mint Test Tokens
                      </h3>
                      <div className="bg-card rounded-md p-4 border space-y-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Amount:</span>
                          <div className="flex items-center gap-3">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-full p-0"
                              onClick={() => adjustAmount(-100)}
                            >
                              <Minus size={isMobile ? 16 : 12} />
                            </Button>
                            <span className="text-base font-medium w-20 text-center">
                              {tokenAmount}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-full p-0"
                              onClick={() => adjustAmount(100)}
                            >
                              <Plus size={isMobile ? 16 : 12} />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            size={isMobile ? "default" : "sm"}
                            onClick={() => mintTokens(tokenAmount, "ETH")}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-6"
                          >
                            Mint ETH
                          </Button>
                          <Button
                            size={isMobile ? "default" : "sm"}
                            onClick={() => mintTokens(tokenAmount, "USDC")}
                            className="bg-green-600 hover:bg-green-700 text-white py-6"
                          >
                            Mint USDC
                          </Button>
                        </div>

                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Input
                            placeholder="Custom token (e.g., DAI)"
                            value={customToken}
                            onChange={(e) => setCustomToken(e.target.value)}
                            className="text-sm h-12 sm:h-9 flex-1"
                          />
                          <Button
                            size={isMobile ? "default" : "sm"}
                            onClick={() => mintTokens(tokenAmount, customToken)}
                            disabled={!customToken}
                            className="h-12 sm:h-9"
                          >
                            Mint
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Section - always visible on desktop, only when tab is active on mobile */}
                  {(!isMobile || activeTab === "admin") && (
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase font-medium text-muted-foreground flex items-center gap-1.5">
                        <Landmark size={14} />
                        Admin Controls
                      </h3>

                      {/* Network Selection */}
                      <div className="bg-card rounded-md p-4 border space-y-3">
                        <h4 className="text-xs font-medium flex items-center gap-1.5 pb-1 border-b border-muted">
                          <Globe size={14} />
                          Network Selection
                        </h4>

                        <div className="space-y-2">
                          {Object.entries(sutils.supportedAvmChains).map(
                            ([chainKey, chain]) => (
                              <button
                                key={chain.id}
                                onClick={() =>
                                  switchNetwork(
                                    chainKey as keyof typeof sutils.supportedAvmChains,
                                  )
                                }
                                className={`w-full text-left px-4 py-3 rounded-md flex items-center justify-between ${
                                  currentChain === chain.name
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      currentChain === chain.name
                                        ? "bg-primary"
                                        : "bg-muted-foreground"
                                    }`}
                                  />
                                  <span className="font-medium">
                                    {chain.name}
                                  </span>
                                </div>
                                {currentChain === chain.name && (
                                  <Check size={16} className="text-primary" />
                                )}
                              </button>
                            ),
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-muted">
                          Current network:{" "}
                          <span className="font-medium">{currentChain}</span>
                          <p className="mt-1 text-xs opacity-70">
                            Note: Switching networks will reload the page.
                          </p>
                        </div>
                      </div>

                      {/* Admin Navigation */}
                      <div className="bg-card rounded-md p-4 border space-y-3">
                        <h4 className="text-xs font-medium flex items-center gap-1.5 pb-1 border-b border-muted">
                          <Landmark size={14} />
                          Admin Pages
                        </h4>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 text-base"
                          onClick={() => (window.location.href = "/admin/init")}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Admin Initialization
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Navigation shortcuts - always visible on desktop, only when tab is active on mobile */}
                  {(!isMobile || activeTab === "nav") && (
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase font-medium text-muted-foreground flex items-center gap-1.5">
                        <Navigation size={14} />
                        Quick Navigation
                      </h3>
                      <div className="bg-card rounded-md p-4 border space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 text-base"
                          onClick={() => (window.location.href = "/swap")}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Swap
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 text-base"
                          onClick={() => (window.location.href = "/pool")}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Pool
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 text-base"
                          onClick={() => (window.location.href = "/")}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Home
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
