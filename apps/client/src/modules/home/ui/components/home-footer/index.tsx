"use client";

import { SiDiscord, SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { sutils } from "@nemi-fi/utils";
import Link from "next/link";

export const HomeFooter = () => {
  return (
    <footer className="w-full border-t border-neutral-100 dark:border-neutral-800 bg-background/80 backdrop-blur-md sticky bottom-0 z-40 transition-all duration-300 py-2">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NEMI
          </p>

          {/* Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/privacy-policy"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Terms of Service
            </Link>

            {/* Social icons */}
            <div className="flex items-center gap-2 ml-1">
              {/* Discord Icon */}
              <Link
                href={sutils.appInfo.discordLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Join our Discord community"
              >
                <SiDiscord
                  size={14}
                  color="#232323"
                  className="dark:text-white"
                />
              </Link>

              {/* Twitter/X Icon */}
              <Link
                href="https://x.com/nemi_fi"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Follow us on Twitter/X"
              >
                <SiX size={14} color="#232323" className="dark:text-white" />
              </Link>

              {/* Telegram Icon */}
              <Link
                href="https://t.me/nemi_fi"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Join our Telegram channel"
              >
                <SiTelegram
                  size={14}
                  color="#232323"
                  className="dark:text-white"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
