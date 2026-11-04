import Image from "#/components/Image.js";
import { cn } from "#/lib/utils.js";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  BriefcaseFaceLight,
  BriefcaseLight,
  BriefcaseProps,
  LID_SHUT_MS,
  SCENE_MS,
  playBriefcase,
} from "./dino-briefcase.js";
import { exhale } from "./dino-smoke.js";

/**
 * The dino cut into layers (tailbed, tail, body, head, jaw), each the full 640×711 frame of
 * brand-assets/mascot/hooded.png with only its part visible, so they stack without offsets.
 */
const RIG = "/images/mascot/rig/v2/dino";

/**
 * Pivots of the moving parts, as % of the frame: the tail swings around where it leaves the cape,
 * the hooded head turns on the neck, and the jaw hinges at the back of the mouth.
 */
const PIVOT = {
  tail: "40.22% 81.79%",
  head: "68.1% 54.15%",
  jaw: "56.29% 45.73%",
} as const;

/**
 * The canvas the smoke is drawn on, as % of the frame: it starts just behind the snout and reaches
 * past the frame's right edge, so wisps can drift out. The nostril sits at (12%, 77%) of it.
 */
const SMOKE_BOX = { left: "86%", top: "2%", width: "56%", height: "40%" };
const NOSTRIL = { x: 0.12, y: 0.77 };

/**
 * The goggles, cut from the artwork as masks (glass and the eyes seen through it). Boxes are the
 * masks' bounds, as % of the frame [left, top, right, bottom].
 */
const GLASS_MASK = `${RIG}-glass-mask.png`;
const EYES_MASK = `${RIG}-eyes-mask.png`;
const GLASS_BOX = [52.55, 22.59, 92.01, 35.56] as const;
const EYE_BOXES = [
  [56.29, 25.9, 65.6, 33.77],
  [78.88, 24.46, 85.92, 30.46],
] as const;

/** Positions an element over a [left, top, right, bottom] box given in % of the frame. */
const box = ([l, t, r, b]: readonly number[]): CSSProperties => ({
  left: `${l}%`,
  top: `${t}%`,
  width: `${(r ?? 0) - (l ?? 0)}%`,
  height: `${(b ?? 0) - (t ?? 0)}%`,
});

/** A full-frame layer cut to one of the goggle masks. */
const masked = (url: string): CSSProperties => ({
  maskImage: `url(${url})`,
  maskSize: "100% 100%",
  WebkitMaskImage: `url(${url})`,
  WebkitMaskSize: "100% 100%",
});

const BUBBLE_MS = 2400;
/** Smoke comes every 9–16 s while the dino idles on screen. */
const SMOKE_MIN_MS = 9000;
const SMOKE_SPREAD_MS = 7000;

/** One-shot moves, played with the Web Animations API so nothing re-renders or reloads. */
const MOVES = {
  hop: [
    { transform: "none" },
    { transform: "translateY(-8%) scale(0.97, 1.04)", offset: 0.3 },
    { transform: "translateY(0) scale(1.05, 0.93)", offset: 0.55 },
    { transform: "scale(0.99, 1.02)", offset: 0.75 },
    { transform: "none" },
  ],
  headLag: [
    { transform: "none" },
    { transform: "rotate(3deg)", offset: 0.3 },
    { transform: "rotate(-2.5deg)", offset: 0.6 },
    { transform: "rotate(1deg)", offset: 0.8 },
    { transform: "none" },
  ],
  wag: [
    { transform: "rotate(0deg)" },
    { transform: "rotate(-4deg)", offset: 0.3 },
    { transform: "rotate(5deg)", offset: 0.7 },
    { transform: "rotate(0deg)" },
  ],
  talk: [{ transform: "rotate(0deg)" }, { transform: "rotate(9deg)" }],
  cheer: [
    { transform: "none" },
    {
      transform: "translateY(-26%) rotate(-8deg) scale(0.95, 1.06)",
      offset: 0.18,
    },
    { transform: "translateY(0) scale(1.07, 0.9)", offset: 0.36 },
    {
      transform: "translateY(-18%) rotate(7deg) scale(0.96, 1.05)",
      offset: 0.56,
    },
    { transform: "translateY(0) scale(1.04, 0.95)", offset: 0.76 },
    { transform: "scale(0.99, 1.01)", offset: 0.88 },
    { transform: "none" },
  ],
} satisfies Record<string, Keyframe[]>;

/**
 * What the dino is doing besides idling:
 * - `hiding`: it ducks behind whatever sits in front of it (the waitlist card) and peeks out;
 * - `cheer`: two happy jumps.
 */
export type DinoMood = "idle" | "hiding" | "cheer";

/** Width of the rig layer files a dino needs: 320w covers up to 160 CSS px on 2x screens. */
type LayerWidth = 320 | 640;

/** Picks the layer width from the dino's `sizes`, by the largest px value in it. */
const layerWidthFor = (sizes: string): LayerWidth => {
  const px = Math.max(
    ...[...sizes.matchAll(/(\d+)px/g)].map((m) => Number(m[1])),
  );
  return px <= 160 ? 320 : 640;
};

/** A full-frame layer drawn as a CSS background (decorative; the body is the content image). */
const layer = (
  name: string,
  origin: string,
  width: LayerWidth,
): CSSProperties => ({
  backgroundImage: `url(${RIG}-${name}-${width}w.webp)`,
  backgroundSize: "100% 100%",
  transformOrigin: origin,
});

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Plays a one-shot move on an element; a no-op without the element or with reduced motion. */
function play(
  ref: RefObject<HTMLElement | null>,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): void {
  if (!ref.current || prefersReducedMotion()) return;
  ref.current.animate(keyframes, { composite: "replace", ...options });
}

/**
 * The hooded dino, alive. It is cut into tail, body, head (with the hood) and jaw, each moving on
 * its own: the tail sways and wags, the head glances around and lags behind a hop, the jaw talks
 * while a line is on screen, it breathes, blinks, its goggles catch the light and now and then it
 * puffs smoke from its nostril. A click makes it hop and say its line; given several lines, each
 * click says the next one. `mood` lets the page drive it (hide while an email is typed, cheer after
 * joining); `moodLine` is what it says then. Idle loops are CSS and pause off screen; one-shot
 * moves use the Web Animations API, so nothing is re-rendered or reloaded mid-move.
 */
export function AnimatedDino({
  line,
  className,
  sizes = "160px",
  bubbleSide = "left",
  mood = "idle",
  moodLine,
  briefcase = false,
}: {
  line: string | readonly string[];
  className?: string;
  sizes?: string;
  bubbleSide?: "left" | "right";
  mood?: DinoMood;
  moodLine?: string;
  /** Adds the briefcase scene: it plays once when the dino first comes into view, then on clicks. */
  briefcase?: boolean;
}) {
  // The bubble keeps its text while it fades out, so it never collapses mid-fade
  const [bubble, setBubble] = useState({ text: "", visible: false });
  const [onScreen, setOnScreen] = useState(true);
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const root = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLSpanElement>(null);
  const hopRef = useRef<HTMLSpanElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const tailNoCaseRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const jawRef = useRef<HTMLSpanElement>(null);
  const smokeRef = useRef<HTMLCanvasElement>(null);
  // True while the briefcase scene plays: clicks, hops and smoke wait for it
  const busy = useRef(false);
  const playedOnce = useRef(false);

  const lines = typeof line === "string" ? [line] : line;
  const layerWidth = layerWidthFor(sizes);

  const say = useCallback((text: string): void => {
    setBubble({ text, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setBubble((b) => ({ ...b, visible: false })),
      BUBBLE_MS,
    );
    play(jawRef, MOVES.talk, {
      duration: 240,
      iterations: 8,
      direction: "alternate",
      easing: "ease-in-out",
    });
    play(tailRef, MOVES.wag, { duration: 420, iterations: 4 });
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // A new mood comes with its own line ("Not looking." when it hides) and, for cheer, the jumps
  useEffect(() => {
    if (mood === "idle") return;
    if (moodLine) say(moodLine);
    if (mood === "cheer") {
      play(moodRef, MOVES.cheer, { duration: 1300, easing: "ease-out" });
    }
  }, [mood, moodLine, say]);

  // Idle loops only run while the dino is on screen
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Now and then, a puff of smoke from the nostril
  useEffect(() => {
    if (!onScreen || mood !== "idle" || prefersReducedMotion()) return;
    let next: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      next = setTimeout(
        () => {
          const canvas = smokeRef.current;
          if (canvas && !document.hidden && !busy.current) {
            exhale(
              canvas,
              NOSTRIL,
              document.documentElement.classList.contains("dark"),
            );
          }
          schedule();
        },
        SMOKE_MIN_MS + Math.random() * SMOKE_SPREAD_MS,
      );
    };
    schedule();
    return () => clearTimeout(next);
  }, [onScreen, mood]);

  const nextLine = (): string => {
    const text = lines[clicks.current % lines.length] ?? "";
    clicks.current += 1;
    return text;
  };

  // The briefcase scene: tail, case, claws, lid and light, then a line once the lid shuts
  const playScene = useCallback((): boolean => {
    const el = root.current;
    if (!briefcase || !el || busy.current || prefersReducedMotion())
      return false;
    busy.current = true;
    playBriefcase(el, {
      tail: tailRef.current,
      tailNoCase: tailNoCaseRef.current,
      head: headRef.current,
      jaw: jawRef.current,
      body: hopRef.current,
      lids: Array.from(el.querySelectorAll('[data-part="eyelid"]')),
    });
    setTimeout(() => say(nextLine()), LID_SHUT_MS + 150);
    setTimeout(() => {
      busy.current = false;
    }, SCENE_MS);
    return true;
    // nextLine reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefcase, say]);

  // Once, shortly after the dino first scrolls into view
  useEffect(() => {
    if (!briefcase || !onScreen || playedOnce.current) return;
    const start = setTimeout(() => {
      playedOnce.current = playScene();
    }, 1400);
    return () => clearTimeout(start);
  }, [briefcase, onScreen, playScene]);

  const onClick = (): void => {
    if (busy.current) return;
    if (playScene()) return;
    say(nextLine());
    if (mood !== "idle") return;
    play(hopRef, MOVES.hop, { duration: 600, easing: "ease-out" });
    play(headRef, MOVES.headLag, { duration: 700, easing: "ease-out" });
  };

  return (
    <div
      ref={root}
      className={cn(
        "relative",
        !onScreen && "[&_*]:[animation-play-state:paused]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Nemi's dino. Click it."
        className="block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
      >
        {/* Mood layer: ducks down while hiding, jumps when cheering */}
        <span
          ref={moodRef}
          className={cn(
            "block origin-bottom transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none",
            mood === "hiding" && "translate-y-[62%]",
          )}
        >
          {/* Peek layer: while hidden, it rises over the edge now and then */}
          <span
            className={cn(
              "block origin-bottom motion-reduce:animate-none",
              mood === "hiding" && "animate-dino-peek",
            )}
          >
            {/* Hop layer: played on click */}
            <span ref={hopRef} className="block origin-bottom">
              <span className="relative block origin-bottom animate-dino-breathe motion-reduce:animate-none">
                {/* Still strip of tail under the swinging one: fills the gap at its root, never doubles it */}
                <span
                  className="absolute inset-0"
                  style={layer("tailbed", PIVOT.tail, layerWidth)}
                  aria-hidden="true"
                />
                {/* Tail with the suitcase, behind the body */}
                <span
                  ref={tailRef}
                  className="absolute inset-0 animate-dino-tail will-change-transform motion-reduce:animate-none"
                  style={layer("tail", PIVOT.tail, layerWidth)}
                  aria-hidden="true"
                />
                {/* The same tail without its case, shown while the case is in the claws */}
                {briefcase && (
                  <span
                    ref={tailNoCaseRef}
                    className="absolute inset-0 opacity-0"
                    style={layer("tail-nocase", PIVOT.tail, layerWidth)}
                    aria-hidden="true"
                  />
                )}
                <Image
                  src={`${RIG}-body-320w.webp`}
                  srcSet={`${RIG}-body-320w.webp 320w, ${RIG}-body-640w.webp 640w`}
                  sizes={sizes}
                  width={640}
                  height={711}
                  alt="Nemi's dinosaur mascot in a hood"
                  className="relative block w-full"
                />
                {briefcase && (
                  <span
                    data-part="capepatch"
                    className="absolute inset-0 opacity-0"
                    style={layer("capepatch", PIVOT.tail, layerWidth)}
                    aria-hidden="true"
                  />
                )}
                {briefcase && <BriefcaseProps rig={RIG} />}
                {/* Head with the hood: glances around, lags behind a hop */}
                <span
                  ref={headRef}
                  className={cn(
                    "absolute inset-0 will-change-transform motion-reduce:animate-none",
                    mood === "idle" && "animate-dino-look",
                  )}
                  style={{ transformOrigin: PIVOT.head }}
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-0"
                    style={layer("head", PIVOT.head, layerWidth)}
                  />
                  {/* Jaw: talks while a line is on screen */}
                  <span
                    ref={jawRef}
                    className="absolute inset-0"
                    style={layer("jaw", PIVOT.jaw, layerWidth)}
                  />
                  {/* Shine on the goggle glass: a soft band sweeps across, cut to the lenses */}
                  <span
                    className="absolute inset-0 overflow-hidden motion-reduce:hidden"
                    style={masked(GLASS_MASK)}
                  >
                    <span
                      className="absolute overflow-hidden"
                      style={box(GLASS_BOX)}
                    >
                      <span className="absolute inset-0 animate-goggle-glint [background:linear-gradient(105deg,transparent_38%,rgb(255_255_255/0.08)_42%,rgb(255_255_255/0.5)_47%,rgb(255_255_255/0.12)_51%,transparent_54%,transparent_58%,rgb(255_255_255/0.28)_60%,transparent_63%)]" />
                    </span>
                  </span>
                  {/* Eyelids behind the glass: they drop over the eyes and lift again */}
                  <span
                    className="absolute inset-0 motion-reduce:hidden"
                    style={masked(EYES_MASK)}
                  >
                    {EYE_BOXES.map((eye) => (
                      <span
                        key={eye[0]}
                        className="absolute overflow-hidden"
                        style={box(eye)}
                      >
                        <span
                          data-part="eyelid"
                          className="absolute inset-[-6%_-6%_auto] h-[112%] animate-dino-blink [background:linear-gradient(to_bottom,rgb(78_75_30),rgb(92_88_36)_55%,rgb(70_67_26)_84%,rgb(14_14_10)_88%,rgb(14_14_10))]"
                        />
                      </span>
                    ))}
                  </span>
                  {briefcase && (
                    <BriefcaseFaceLight
                      headMask={`${RIG}-head-${layerWidth}w.webp`}
                      glassMask={GLASS_MASK}
                    />
                  )}
                  {/* Smoke from the nostril, drawn only while it exhales */}
                  <canvas
                    ref={smokeRef}
                    className="pointer-events-none absolute motion-reduce:hidden"
                    style={SMOKE_BOX}
                  />
                </span>
                {briefcase && <BriefcaseLight />}
              </span>
            </span>
          </span>
        </span>
      </button>
      <p
        role="status"
        className={cn(
          "pointer-events-none absolute -top-9 rounded-2xl bg-black px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform] dark:bg-white dark:text-black",
          bubbleSide === "left"
            ? "right-[70%] origin-bottom-right rounded-br-sm"
            : "left-[70%] origin-bottom-left rounded-bl-sm",
          bubble.visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-1 scale-95 opacity-0",
        )}
      >
        {bubble.text}
      </p>
    </div>
  );
}
