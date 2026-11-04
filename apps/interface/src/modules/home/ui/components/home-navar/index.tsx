"use client";

import { useIsMobile } from "#/hooks/use-mobile.js";
import { StaticLogo } from "#/components/StaticLogo.js";
import { Button } from "#/components/ui/button.js";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog.js";
import ThemeToggleButton from "#/components/ui/theme-toggle-button.js";
import { cn } from "#/lib/utils.js";
import { SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { appInfo } from "@nemi-fi/utils/appInfo";
import {
  DesktopIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react"; // ArrowUpRight: for the docs link, offline for now
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { TestnetBadge } from "../../components/testnet-badge/index.js";
// The wallet button pulls in the SDK; it is only shown on app pages (and after launch), so load it
// on demand
const WalletConnect = lazy(() =>
  import("../wallet-connect/index.js").then((mod) => ({
    default: mod.WalletConnect,
  })),
);

// Navigation links constant
const NAV_LINKS = [
  { name: "Swap", href: "/swap" },
  { name: "Pool", href: "/pool" },
  // { name: "Verify", href: "/verify" },
];

/** Socials (and docs, once they are back) at the bottom of the mobile menu, as in the landing footer. */
const ELSEWHERE = [
  // Docs are offline for now; bring this back when docs.nemi.fi is up
  // { name: "Docs", href: "https://docs.nemi.fi", Icon: ArrowUpRight },
  { name: "X", href: "https://x.com/nemi_fi", Icon: SiX },
  { name: "Telegram", href: appInfo.telegramLink, Icon: SiTelegram },
] as const;

/** A link in the mobile menu; `href` may be a route or an in-page anchor like "#faq-heading". */
export interface MenuLink {
  readonly name: string;
  readonly href: string;
}

/** Small mono label over a group in the mobile menu, like the table headers on the landing. */
const menuLabelClassName =
  "font-mono text-[11px] tracking-wider text-black/50 uppercase dark:text-white/50";
const menuRowClassName =
  "flex items-center justify-between border-b border-black/10 py-4 text-lg font-medium focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-white/10";

// Theme options constant
const THEME_OPTIONS = [
  { name: "System", value: "system", icon: DesktopIcon },
  { name: "Light", value: "light", icon: SunIcon },
  { name: "Dark", value: "dark", icon: MoonIcon },
];

// Simple theme selector component
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  // `theme` is unknown during SSR; highlight nothing until mounted to avoid a hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="inline-flex rounded-full border border-black/15 p-1 dark:border-white/20"
      role="group"
      aria-label="Theme"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white",
            )}
            onClick={() => setTheme(option.value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {option.name}
          </button>
        );
      })}
    </div>
  );
};

/** Navbar props a route can set through its `handle` (see `NavbarHandle`), e.g. the landing's. */
export interface NavbarProps {
  readonly action?: ReactNode;
  readonly pageLinks?: readonly MenuLink[];
}

/**
 * Route `handle` shape read by the root layout: the deepest matched route with a `navbar` sets the
 * navbar's props.
 */
export interface NavbarHandle {
  readonly navbar?: NavbarProps;
}

/**
 * Site navbar, on every page (rendered by the root layout). `action` replaces the wallet button on the right and in the mobile menu, e.g. the
 * landing's "Join the waitlist" before swaps open; the app pages keep the wallet button.
 * `pageLinks` adds an "On this page" list to the mobile menu (the landing's sections).
 */
export const HomeNavbar = ({ action, pageLinks = [] }: NavbarProps = {}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const isMobile = useIsMobile();

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
      <nav
        aria-labelledby="main-menu-heading"
        className={cn(
          "relative w-full py-2 px-4 md:px-6 flex justify-between items-center border-b backdrop-blur-md transition-all duration-300",
          scrolled
            ? "bg-background/95 shadow-sm border-background/20"
            : "bg-background/50",
        )}
      >
        <h2 id="main-menu-heading" className="sr-only">
          Menu
        </h2>
        {/* Left section: Logo and mobile menu button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setModalOpen(true)}
          >
            <ListIcon className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          <Link to="/" className="flex items-center" aria-label="Nemi Home">
            {isMobile ? (
              <StaticLogo fullLogo={false} width={38} height={38} />
            ) : (
              <StaticLogo width={110} height={32} />
            )}
          </Link>
          {/* ALPHA on mainnet, TESTNET on testnet */}
          <div className="-mt-1 -ml-1.5">
            <TestnetBadge />
          </div>
        </div>

        {/* Desktop navigation: centred on the page, not between the uneven left and right sections */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ul className="flex items-center gap-1 bg-muted/30 backdrop-blur-sm p-1 rounded-full border border-border/40">
            {NAV_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className={cn(
                    "block text-sm leading-5 font-medium px-5 py-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-blue-500",
                    pathname.startsWith(link.href)
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                  onClick={() => handleNavClick(link.href)}
                  prefetch="intent"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right section: Theme toggle and wallet */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggleButton />
          </div>
          {action ?? (
            <Suspense fallback={null}>
              <WalletConnect />
            </Suspense>
          )}
        </div>
      </nav>

      {/* Mobile menu: plain rows and mono labels, like the landing's tables and FAQ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="m-0 flex h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-none bg-white p-0 text-black duration-300 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full dark:bg-black dark:text-white">
          <div className="flex items-center px-6 pt-5 pb-4">
            <Link
              to="/"
              aria-label="Nemi home"
              onClick={() => setModalOpen(false)}
            >
              <StaticLogo width={88} height={26} />
            </Link>
            <div className="-mt-1 ml-1.5">
              <TestnetBadge />
            </div>
            <DialogTitle className="sr-only">Menu</DialogTitle>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
            {action ? (
              // Close the menu when its action is used (e.g. the waitlist form opening in a new tab)
              <div className="mt-2" onClick={() => setModalOpen(false)}>
                {action}
              </div>
            ) : (
              <div className="mt-2">
                <Suspense fallback={null}>
                  <WalletConnect fullWidth />
                </Suspense>
              </div>
            )}

            {pageLinks.length > 0 && (
              <nav aria-labelledby="menu-page-heading" className="mt-8">
                <h2 id="menu-page-heading" className={menuLabelClassName}>
                  On this page
                </h2>
                <ul className="mt-2 border-t border-black/10 dark:border-white/10">
                  {pageLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className={menuRowClassName}
                        onClick={() => setModalOpen(false)}
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <nav aria-labelledby="menu-app-heading" className="mt-8">
              <h2 id="menu-app-heading" className={menuLabelClassName}>
                App
              </h2>
              <ul className="mt-2 border-t border-black/10 dark:border-white/10">
                {NAV_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className={cn(
                        menuRowClassName,
                        pathname.startsWith(link.href)
                          ? "text-black dark:text-white"
                          : "text-black/70 dark:text-white/70",
                      )}
                      onClick={() => handleNavClick(link.href)}
                      prefetch="intent"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-10">
              <ul className="flex items-center gap-5 text-sm font-medium">
                {ELSEWHERE.map(({ name, href, Icon }) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                    >
                      <Icon size={14} className="size-3.5" aria-hidden="true" />
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
              <ThemeSelector />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
