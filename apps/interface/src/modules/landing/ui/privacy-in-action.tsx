import { cn } from "#/lib/utils.js";
import { SiTelegram } from "@icons-pack/react-simple-icons";
import { sutils } from "@nemi-fi/utils";
import { Shield, ShieldAlert } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router";

type Swap = { name: string; amountIn: string; amountOut: string };

const SWAPS: Swap[] = [
  { name: "vitalik.eth", amountIn: "1 ETH", amountOut: "4000 USDC" },
  { name: "Coinbase", amountIn: "50 BTC", amountOut: "1250 ETH" },
  { name: "You", amountIn: "1000 DAI", amountOut: "0.01 BTC" },
];

/** Sweep speed: 30% of the width per second, so a full 0 → 100 sweep takes this long. */
const FULL_SWEEP_MS = (100 / 30) * 1000;
/** Pause between the end of an interaction and the sweep resuming. */
const RESUME_DELAY_MS = 100;
const KEYBOARD_STEP = 5;

/*
 * How the divider position `p` (0 = fully exposed, 100 = fully private) is rendered.
 *
 * Every moving element gets one Web Animation whose timeline maps linearly onto `p`:
 * `currentTime = p / 100 * FULL_SWEEP_MS`. So:
 * - the auto sweep is simply `play()`: the compositor runs it with no main-thread work, at a
 *   constant 30%/s from wherever the animations currently are, and stops at 100 (`fill`);
 * - interaction pauses the animations and scrubs them by setting `currentTime`;
 * - the current `p` is always readable from `currentTime`, which makes the handoff between
 *   sweep and interaction seamless in both directions.
 *
 * The reveal is a transform-only "sliding window": the private layer lives in an
 * `overflow: hidden` window the size of the area. The window is shifted left by `(100 - p)%`
 * so only the left `p%` of the area is covered, and its content is shifted right by the same
 * amount, so the private rows stay perfectly still over the exposed rows underneath.
 *
 * The inline styles below are the `p = 0` frame, so the SSR HTML (and the page before
 * hydration, or without Web Animations) shows the initial state.
 */
const WINDOW_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(-100%)" },
  { transform: "translateX(0%)" },
];
const WINDOW_CONTENT_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(100%)" },
  { transform: "translateX(0%)" },
];
const DIVIDER_TRACK_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0%)" },
  { transform: "translateX(100%)" },
];
// Labels fade out when the divider is within ~3% of the edge they would overflow.
const PRIVATE_LABEL_KEYFRAMES: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 0.03 },
  { opacity: 1, offset: 1 },
];
const EXPOSED_LABEL_KEYFRAMES: Keyframe[] = [
  { opacity: 1, offset: 0 },
  { opacity: 1, offset: 0.97 },
  { opacity: 0, offset: 1 },
];

const INITIAL_STYLES = {
  window: { transform: "translateX(-100%)" },
  windowContent: { transform: "translateX(100%)" },
  dividerTrack: { transform: "translateX(0%)" },
  privateLabel: { opacity: 0 },
  exposedLabel: { opacity: 1 },
} satisfies Record<string, CSSProperties>;

const clamp = (p: number) => Math.min(100, Math.max(0, p));

export function PrivacyInAction() {
  const areaRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const windowContentRef = useRef<HTMLDivElement>(null);
  const dividerTrackRef = useRef<HTMLDivElement>(null);
  const privateLabelRef = useRef<HTMLDivElement>(null);
  const exposedLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const targets: [HTMLElement | null, Keyframe[]][] = [
      [windowRef.current, WINDOW_KEYFRAMES],
      [windowContentRef.current, WINDOW_CONTENT_KEYFRAMES],
      [dividerTrackRef.current, DIVIDER_TRACK_KEYFRAMES],
      [privateLabelRef.current, PRIVATE_LABEL_KEYFRAMES],
      [exposedLabelRef.current, EXPOSED_LABEL_KEYFRAMES],
    ];
    if (!area || targets.some(([el]) => !el)) return;
    if (typeof area.animate !== "function") return; // no Web Animations: stay static

    const animations = targets.map(([el, keyframes]) => {
      const animation = el!.animate(keyframes, {
        duration: FULL_SWEEP_MS,
        easing: "linear",
        fill: "both",
      });
      animation.pause();
      animation.currentTime = 0;
      return animation;
    });

    const getP = () => {
      const t = animations[0]!.currentTime;
      return typeof t === "number" ? clamp((t / FULL_SWEEP_MS) * 100) : 0;
    };
    /** Freezes the animations at `p`; the only per-frame write during interaction. */
    const setP = (p: number) => {
      const time = (clamp(p) / 100) * FULL_SWEEP_MS;
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = time;
      }
    };
    const updateAria = (p = getP()) => {
      const value = Math.round(p);
      area.setAttribute("aria-valuenow", String(value));
      area.setAttribute("aria-valuetext", `${value}% private`);
    };
    const prefersReducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let sweepStarted = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    /** Runs the sweep on the compositor from the current `p` toward 100. */
    const playSweep = () => {
      sweepStarted = true;
      const p = getP();
      // Already at the end: `play()` on a finished animation would rewind it to 0.
      if (prefersReducedMotion() || p >= 100) {
        updateAria(p);
        return;
      }
      setP(p); // re-sync all animations to the same time before playing them together
      for (const animation of animations) animation.play();
    };
    const stopSweep = () => {
      sweepStarted = true;
      clearTimeout(resumeTimer);
      setP(getP());
    };
    const onSweepFinish = () => updateAria(100);
    animations[0]!.addEventListener("finish", onSweepFinish);

    if (prefersReducedMotion()) {
      sweepStarted = true;
      setP(100);
      updateAria(100);
    }

    // Start the sweep the first time at least ~30% of the area is visible.
    let intersectionObserver: IntersectionObserver | undefined;
    if (!sweepStarted) {
      if (typeof IntersectionObserver === "undefined") {
        playSweep();
      } else {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            intersectionObserver?.disconnect();
            if (!sweepStarted) playSweep();
          },
          { threshold: 0.3 },
        );
        intersectionObserver.observe(area);
      }
    }

    // Cached geometry, so pointer moves never read layout.
    let rectLeft = 0;
    let rectWidth = 0;
    const cacheRect = () => {
      const rect = area.getBoundingClientRect();
      rectLeft = rect.left;
      rectWidth = rect.width;
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(cacheRect);
    resizeObserver?.observe(area);

    // Pointer input, coalesced to at most one update per frame.
    let hovering = false;
    let dragPointerId: number | null = null;
    let pendingX: number | null = null;
    let frame = 0;
    const flush = () => {
      frame = 0;
      if (pendingX === null || rectWidth <= 0) return;
      setP(((pendingX - rectLeft) / rectWidth) * 100);
      pendingX = null;
    };
    const queueX = (clientX: number) => {
      pendingX = clientX;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const startInteraction = () => {
      cacheRect();
      stopSweep();
    };
    const endInteraction = () => {
      if (hovering || dragPointerId !== null) return;
      cancelAnimationFrame(frame);
      flush();
      updateAria();
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!hovering && dragPointerId === null) playSweep();
      }, RESUME_DELAY_MS);
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      startInteraction();
      queueX(e.clientX);
    };
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !hovering) return;
      hovering = false;
      endInteraction();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        cacheRect();
        return;
      }
      // Touch / pen: only freeze here. The divider moves on actual horizontal drags, so a
      // vertical scroll that starts on the widget doesn't make it jump.
      dragPointerId = e.pointerId;
      startInteraction();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (
        e.pointerType === "mouse" ? hovering : e.pointerId === dragPointerId
      ) {
        queueX(e.clientX);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragPointerId) return;
      dragPointerId = null;
      endInteraction();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      let next: number;
      const p = getP();
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          next = p - KEYBOARD_STEP;
          break;
        case "ArrowRight":
        case "ArrowUp":
          next = p + KEYBOARD_STEP;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = 100;
          break;
        default:
          return;
      }
      e.preventDefault();
      stopSweep();
      setP(next);
      updateAria();
    };

    const passive = { passive: true } as const;
    area.addEventListener("pointerenter", onPointerEnter, passive);
    area.addEventListener("pointerleave", onPointerLeave, passive);
    area.addEventListener("pointerdown", onPointerDown, passive);
    area.addEventListener("pointermove", onPointerMove, passive);
    area.addEventListener("pointerup", onPointerUp, passive);
    area.addEventListener("pointercancel", onPointerUp, passive);
    area.addEventListener("keydown", onKeyDown);

    return () => {
      area.removeEventListener("pointerenter", onPointerEnter);
      area.removeEventListener("pointerleave", onPointerLeave);
      area.removeEventListener("pointerdown", onPointerDown);
      area.removeEventListener("pointermove", onPointerMove);
      area.removeEventListener("pointerup", onPointerUp);
      area.removeEventListener("pointercancel", onPointerUp);
      area.removeEventListener("keydown", onKeyDown);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(resumeTimer);
      animations[0]!.removeEventListener("finish", onSweepFinish);
      for (const animation of animations) animation.cancel();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-card text-card-foreground shadow-xl shadow-black/5 dark:border-white/10 dark:shadow-black/30">
      <div className="px-3 pt-5 pb-4 sm:px-5 md:px-6 md:pt-6">
        <h2 className="text-center text-lg font-bold sm:text-xl md:text-2xl">
          Privacy In Action
        </h2>
        <p className="mt-1 text-center text-xs text-black/60 dark:text-white/60">
          Interact with transactions below
        </p>

        <ul className="sr-only">
          {SWAPS.map((swap) => (
            <li key={swap.name}>
              {swap.name} swapped {swap.amountIn} for {swap.amountOut}; on Nemi
              this swap is private.
            </li>
          ))}
        </ul>

        <div
          ref={areaRef}
          role="slider"
          tabIndex={0}
          aria-label="Privacy comparison: private on the left, exposed on the right"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-valuetext="0% private"
          aria-orientation="horizontal"
          className="relative mt-4 touch-pan-y overflow-hidden rounded-2xl bg-card outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {/* Exposed layer: in normal flow, gives the area its height */}
          <SwapRows variant="exposed" />

          {/* Private layer: sliding window covering the left p% of the area */}
          <div
            ref={windowRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
            style={INITIAL_STYLES.window}
          >
            <div
              ref={windowContentRef}
              className="absolute inset-0 bg-card will-change-transform"
              style={INITIAL_STYLES.windowContent}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent dark:from-black/30" />
              <SwapRows variant="private" className="relative" />
            </div>
          </div>

          {/* Divider and labels: a full-width track translated by p% of the area width */}
          <div
            ref={dividerTrackRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 will-change-transform"
            style={INITIAL_STYLES.dividerTrack}
          >
            <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-black/80 shadow-[0_0_8px_rgba(0,0,0,0.35)] dark:bg-white/80 dark:shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
            <div
              ref={privateLabelRef}
              className={cn(labelClassName, "right-full mr-2 bg-green-600")}
              style={INITIAL_STYLES.privateLabel}
            >
              <Shield className="size-3 md:size-4" />
              Private
            </div>
            <div
              ref={exposedLabelRef}
              className={cn(labelClassName, "left-full ml-2 bg-red-500")}
              style={INITIAL_STYLES.exposedLabel}
            >
              <ShieldAlert className="size-3 md:size-4" />
              Exposed
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-black/10 bg-gray-100/80 px-4 py-4 text-center dark:border-white/10 dark:bg-black/80 md:px-6">
        <p className="text-sm text-black/80 dark:text-white/80">
          Nemi protects your transaction privacy automatically
        </p>
        <Link
          to={sutils.appInfo.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0088cc] px-6 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#006fa3] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <SiTelegram size={18} />
          JOIN TELEGRAM
        </Link>
      </div>
    </div>
  );
}

const labelClassName =
  "absolute top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider whitespace-nowrap text-white uppercase shadow-sm sm:text-xs md:top-3 md:px-3 md:py-1 md:text-sm";

function SwapRows({
  variant,
  className,
}: {
  variant: "private" | "exposed";
  className?: string;
}) {
  return (
    // Top padding leaves room for the labels pinned to the top of the area.
    <div
      aria-hidden="true"
      className={cn("flex flex-col gap-2 px-2 pt-10 pb-3 md:pt-14", className)}
    >
      {SWAPS.map((swap) => (
        <SwapRow key={swap.name} swap={swap} variant={variant} />
      ))}
    </div>
  );
}

function SwapRow({
  swap,
  variant,
}: {
  swap: Swap;
  variant: "private" | "exposed";
}) {
  const isPrivate = variant === "private";
  // Both variants share this exact box model so they overlay character for character.
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm whitespace-nowrap md:gap-3 md:px-6 md:py-3 md:text-base",
        isPrivate
          ? "bg-slate-200/40 dark:bg-slate-800/40"
          : "bg-black/15 shadow-md dark:bg-white/15",
      )}
    >
      {isPrivate ? (
        <Shield className="size-4 shrink-0 text-green-600 md:size-5" />
      ) : (
        <ShieldAlert className="size-4 shrink-0 text-red-500 md:size-5" />
      )}
      <span>
        <Secret text={swap.name} hidden={isPrivate} /> swapped{" "}
        <Secret
          text={swap.amountIn}
          hidden={isPrivate}
          className={
            isPrivate ? "text-gray-700 dark:text-gray-300" : "text-[#ea789c]"
          }
        />{" "}
        for{" "}
        <Secret
          text={swap.amountOut}
          hidden={isPrivate}
          className={
            isPrivate ? "text-gray-700 dark:text-gray-300" : "text-[#aca22b]"
          }
        />
      </span>
    </div>
  );
}

/**
 * A variable part of a row. When hidden it renders `█` once per character, overlaid on an
 * invisible copy of the text so it occupies exactly the same width as the clear text and the
 * readable words ("swapped", "for") line up across both layers.
 */
function Secret({
  text,
  hidden,
  className,
}: {
  text: string;
  hidden: boolean;
  className?: string;
}) {
  if (!hidden) return <span className={className}>{text}</span>;
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="invisible">{text}</span>
      <span className="absolute inset-0 overflow-hidden">
        {"█".repeat(text.length)}
      </span>
    </span>
  );
}
