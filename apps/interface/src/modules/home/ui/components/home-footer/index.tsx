"use client";
import { StaticLogo } from "#/components/StaticLogo.js";
import { SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { appInfo } from "@nemi-fi/utils/appInfo";
import { Link } from "react-router";

const LINKS = [
  // Docs are offline for now; bring this back when docs.nemi.fi is up
  // { name: "Docs", href: "https://docs.nemi.fi", external: true },
  { name: "Privacy Policy", href: "/privacy-policy", external: false },
  { name: "Terms of Service", href: "/terms-of-service", external: false },
];

const SOCIALS = [
  { name: "Nemi on X", href: "https://x.com/nemi_fi", Icon: SiX },
  {
    name: "Nemi on Telegram",
    href: appInfo.telegramLink,
    Icon: SiTelegram,
  },
];

const linkClassName =
  "text-black/60 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-white/60 dark:hover:text-white";

/** Site footer, on every page (rendered by the root layout): logo, year and socials, then docs and legal links. */
export function HomeFooter() {
  return (
    <footer
      className="w-full border-t border-black/15 bg-white px-4 text-sm text-black md:px-6 dark:border-white/15 dark:bg-black dark:text-white"
      role="contentinfo"
    >
      <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Nemi home">
            <StaticLogo width={80} height={24} />
          </Link>
          <span className="text-black/60 dark:text-white/60">
            © {new Date().getFullYear()} Nemi
          </span>
          {/* Navigation blocks carry their own (visually hidden) heading */}
          <nav aria-labelledby="footer-social-heading">
            <h2 id="footer-social-heading" className="sr-only">
              Nemi elsewhere
            </h2>
            <ul className="flex items-center gap-4">
              {SOCIALS.map(({ name, href, Icon }) => (
                <li key={name} className="flex">
                  <Link
                    to={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className={linkClassName}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <nav aria-labelledby="footer-links-heading">
          <h2 id="footer-links-heading" className="sr-only">
            Legal
          </h2>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className={linkClassName}
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
