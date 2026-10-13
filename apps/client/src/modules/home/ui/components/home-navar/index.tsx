"use client";

import { StaticLogo } from "@/components/StaticLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TestnetBadge } from "../../components/testnet-badge";
import { WalletConnect } from "../wallet-connect";

// Navigation links constant
const NAV_LINKS = [
  { name: "Swap", href: "/swap" },
  { name: "Pool", href: "/pool" },
  // { name: "Verify", href: "/verify" },
];

// Theme options constant
const THEME_OPTIONS = [
  { name: "Light", value: "light", icon: Sun },
  { name: "Dark", value: "dark", icon: Moon },
];

// Animation styles for TestnetBadge
const animatedBadgeClass =
  "transition-transform hover:scale-105 animate-float cursor-pointer";

// Define the animation in a style tag
const AnimatedBadgeStyle = () => (
  <style jsx global>{`
    @keyframes float {
      0% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-4px);
      }
      100% {
        transform: translateY(0px);
      }
    }

    .animate-float {
      animation: float 3s ease-in-out infinite;
    }

    .animate-float:hover {
      animation-duration: 1.5s;
    }
  `}</style>
);

// Simple theme selector component
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg transition-all",
              isActive
                ? "bg-primary/10 text-primary border-primary/30 border shadow-sm"
                : "hover:bg-muted border border-transparent hover:scale-105",
            )}
            onClick={() => setTheme(option.value)}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{option.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export const HomeNavbar = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Detect if viewport is mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when navigating
  const handleNavClick = (href: string) => {
    if (href !== "#") {
      setModalOpen(false);
    }
  };

  return (
    <>
      <AnimatedBadgeStyle />
      <nav
        className={cn(
          "w-full py-2 px-4 md:px-6 flex justify-between items-center border-b backdrop-blur-md transition-all duration-300",
          scrolled
            ? "bg-background/95 shadow-sm border-background/20"
            : "bg-background/50",
        )}
      >
        {/* Left section: Logo and mobile menu button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setModalOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          <Link href="/">
            <div className="flex items-center">
              <>
                {isMobile ? (
                  <div className="flex items-center relative">
                    <StaticLogo fullLogo={false} width={38} height={38} />
                    <div className={`ml-1.5 -mt-1 ${animatedBadgeClass}`}>
                      <TestnetBadge />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <StaticLogo width={110} height={32} />
                    <div className={`ml-1.5 -mt-1 ${animatedBadgeClass}`}>
                      <TestnetBadge />
                    </div>
                  </div>
                )}
              </>
            </div>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div
          className="hidden md:flex items-center justify-center"
          // TODO: remove this once we have a proper header layout
          style={{ marginLeft: "12px" }}
        >
          <div className="flex space-x-2 bg-muted/30 backdrop-blur-sm p-1 rounded-full border border-border/40">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const isDisabled = link.href === "#";

              return (
                <Link
                  key={link.name}
                  href={isDisabled ? "#" : link.href}
                  className={cn(
                    "text-sm font-medium px-5 py-2 rounded-full transition-all",
                    isActive
                      ? "bg-background/80 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/80 transition-all",
                    isDisabled && "cursor-not-allowed relative group",
                  )}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    } else {
                      handleNavClick(link.href);
                    }
                  }}
                  prefetch={!isDisabled}
                >
                  {link.name}
                  {isDisabled && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-10 bg-background/90 border text-xs font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md backdrop-blur-sm z-10">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right section: Theme toggle and wallet */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggleButton variant="circle" start="bottom-left" />
          </div>
          <WalletConnect />
        </div>
      </nav>

      {/* Mobile menu dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-none w-full h-[100dvh] p-0 m-0 rounded-none border-none data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full duration-300">
          <DialogHeader className="border-b bg-background/90 backdrop-blur-md px-6 py-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <StaticLogo width={80} height={24} />
                <div className={`ml-1.5 -mt-1 ${animatedBadgeClass}`}>
                  <TestnetBadge />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tracking-wide uppercase">
                Decentralized Exchange
              </span>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto bg-background/95 backdrop-blur-md h-full">
            <div className="mb-6 bg-card/80 backdrop-blur-sm rounded-xl border p-4 shadow-sm">
              <div className="flex items-center mb-2">
                <Wallet className="h-4 w-4 mr-2" />
                <span className="font-medium">Connect Wallet</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Connect your wallet to access all features
              </p>
              <WalletConnect fullWidth />
            </div>

            {/* Navigation section */}

            <div className="mb-6">
              <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-3 flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/70 mr-2"></div>
                Navigation Menu
              </h3>
              <div className="rounded-xl border bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const isDisabled = link.href === "#";

                  return (
                    <Link
                      key={link.name}
                      href={isDisabled ? "#" : link.href}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 transition-all block w-full",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50",
                        isDisabled && "cursor-not-allowed opacity-70",
                      )}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                        } else {
                          handleNavClick(link.href);
                        }
                      }}
                      prefetch={!isDisabled}
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <span>{link.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Theme section */}
            <div>
              <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-3 flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/70 mr-2"></div>
                Theme Settings
              </h3>
              <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 shadow-sm">
                <ThemeSelector />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
