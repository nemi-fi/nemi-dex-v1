"use client";

import { SiDiscord, SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { sutils } from "@nemi-fi/utils";
import { Link } from "react-router";

const SOCIAL_LINKS = [
  {
    href: sutils.appInfo.discordLink,
    label: "Join our Discord community",
    Icon: SiDiscord,
  },
  { href: "https://x.com/nemi_fi", label: "Follow us on Twitter/X", Icon: SiX },
  {
    href: "https://t.me/nemi_fi",
    label: "Join our Telegram channel",
    Icon: SiTelegram,
  },
];

export const HomeFooter = () => {
  return (
    <footer className="sticky bottom-0 z-40 w-full border-t border-neutral-200 bg-background px-4 py-4 shadow-md md:px-6 dark:border-neutral-800">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Social icons */}
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              to={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={label}
            >
              <Icon className="h-5 w-5" color="currentColor" />
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            to="/privacy-policy"
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            Terms of Service
          </Link>
          <span>© {new Date().getFullYear()} Nemi. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
