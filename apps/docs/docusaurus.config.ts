import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";
import { telegramLink } from "./src";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Nemi",
  tagline:
    "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital",
  favicon: "img/favicon.ico",

  // Redirect root to documentation
  onDuplicateRoutes: "warn",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    faster: false,
  },

  // Set the production url of your site here
  url: "https://docs.nemi.fi",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  organizationName: "nemi-fi",
  projectName: "nemi",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/", // Docs at root
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
        },
        blog: false, // Disable blog
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: "/",
        indexBlog: false,
      },
    ],
  ],
  themeConfig: {
    image: "img/og-image.jpg",
    metadata: [
      {
        name: "description",
        content:
          "Nemi is a revolutionary privacy-focused DEX protecting traders from strategy leaks, copy trading, and doxxing while unlocking trillions in sidelined TradFi capital.",
      },
      {
        name: "keywords",
        content:
          "DeFi, Privacy, DEX, Decentralized Exchange, Crypto, Trading, Blockchain, private DEX, privacy-focused decentralized exchange, Aztec DEX, zero knowledge DEX, zk-rollup DEX, DeFi privacy, Aztec protocol exchange, shielded trading DeFi, private crypto trading, confidential DeFi, zero-knowledge trading, zk DeFi exchange, Ethereum privacy layer, anonymous crypto swap, private token exchange, on-chain privacy DEX, secure DeFi platform, Aztec privacy layer, privacy-preserving DeFi, decentralized private finance",
      },
      { name: "author", content: "Nemi Team" },
      { name: "apple-mobile-web-app-title", content: "Nemi" },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Nemi: Privacy-First Decentralized Exchange",
      },
      {
        property: "og:description",
        content:
          "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital",
      },
      { property: "og:url", content: "https://docs.nemi.fi" },
      { property: "og:site_name", content: "Nemi DeFi" },
      { property: "og:locale", content: "en_US" },
      {
        property: "og:image",
        content: "https://docs.nemi.fi/img/og-image.jpg",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Nemi DeFi Platform" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@nemi_fi" },
      { name: "twitter:creator", content: "@nemi_fi" },
      { name: "twitter:title", content: "Nemi: Privacy-First DeFi" },
      {
        name: "twitter:description",
        content:
          "Privacy-focused DEX protecting traders while unlocking trillions in sidelined capital",
      },
      {
        name: "twitter:image",
        content: "https://docs.nemi.fi/img/og-image.jpg",
      },
      { name: "theme-color", content: "#121212" },
    ],
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Nemi",
      logo: {
        alt: "Nemi Logo",
        src: "img/logo-dark.svg",
        srcDark: "img/logo-light.svg",
        height: 24,
        width: 24,
      },
      items: [
        {
          href: telegramLink,
          position: "right",
          className: "header-telegram-link",
          "aria-label": "Telegram community",
        },
        {
          type: "search",
          position: "right",
        },
        {
          href: "https://nemi.fi",
          label: "Launch App",
          position: "right",
          className: "header-cta-button",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [],
      copyright: `© ${new Date().getFullYear()} Nemi`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "typescript", "javascript", "json"],
    },
    algolia: undefined, // Using local search instead
  } satisfies Preset.ThemeConfig,
};

export default config;
