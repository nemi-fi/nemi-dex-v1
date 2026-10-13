import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "intro",
    {
      type: "html",
      value: '<div class="sidebar-separator"><span>Tutorials</span></div>',
      className: "sidebar-separator-item",
    },
    "swap-tutorial",
    "providing-liquidity",
    {
      type: "html",
      value: '<div class="sidebar-separator"><span>Reference</span></div>',
      className: "sidebar-separator-item",
    },
    "risks",
    "glossary",
  ],
};

export default sidebars;
