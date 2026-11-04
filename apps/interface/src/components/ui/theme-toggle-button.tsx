"use client";

import React from "react";
import { flushSync } from "react-dom";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

import { Button } from "#/components/ui/button.js";

/** Order the button cycles through on each click. */
const THEME_CYCLE = ["system", "light", "dark"] as const;
type ThemeChoice = (typeof THEME_CYCLE)[number];
const THEME_LABELS: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ANIMATION_DURATION_MS = 500;

/**
 * Disables the browser's default cross-fade so only our clip-path reveal runs.
 * The old snapshot stays static underneath while the new one is revealed.
 */
const VIEW_TRANSITION_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
`;

function ensureViewTransitionStyles() {
  const id = "theme-transition-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = VIEW_TRANSITION_CSS;
  document.head.appendChild(style);
}

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  // `theme` is unknown during SSR; render the system icon until mounted to avoid a hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const current: ThemeChoice =
    mounted && THEME_CYCLE.includes(theme as ThemeChoice)
      ? (theme as ThemeChoice)
      : "system";
  const next =
    THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length]!;

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const toggleTheme = React.useCallback(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || reduceMotion) {
      setTheme(next);
      return;
    }

    ensureViewTransitionStyles();

    // Reveal circle grows from the button's center to the farthest viewport corner
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      // Commit the theme (and next-themes' effect that toggles the `dark` class)
      // synchronously, so the "new" snapshot is captured with the new theme
      // instead of React updating the DOM mid-animation.
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
        // clip-path animations run on the compositor, unlike the previous
        // full-page `mask-size` animation that repainted on every frame.
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: ANIMATION_DURATION_MS,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        // Transition was skipped (e.g. tab hidden); the theme is already applied.
      });
  }, [next, setTheme]);

  return (
    <Button
      ref={buttonRef}
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="w-9 p-0 h-9 relative group"
      name="Theme Toggle Button"
      title={`Theme: ${THEME_LABELS[current]}`}
      aria-label={`Theme: ${THEME_LABELS[current]}. Switch to ${THEME_LABELS[next]}`}
    >
      {current === "system" ? (
        <DesktopIcon className="size-[1.2rem]" />
      ) : current === "light" ? (
        <SunIcon className="size-[1.2rem]" />
      ) : (
        <MoonIcon className="size-[1.2rem]" />
      )}
    </Button>
  );
}
