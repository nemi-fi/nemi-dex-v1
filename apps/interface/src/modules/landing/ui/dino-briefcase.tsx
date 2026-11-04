import type { CSSProperties, ReactElement } from "react";

/**
 * The briefcase scene for the bottom dino. The case is the one from the artwork, cut out with its
 * lid (top face and handle) as a separate piece, so nothing changes style when it leaves the tail:
 * the tail gives it a soft flick, the case floats round the front into the claws, a squeeze pops
 * the latches, the lid cracks open, then swings up and a golden light spills over the dino's face.
 * What is inside is never shown.
 *
 * Parts are plain elements tagged with `data-part`; {@link playBriefcase} drives them with the
 * Web Animations API, so nothing re-renders while it plays.
 */

const INK = "#000";

/** The case's own box in the dino's 640×711 frame (% of the frame), where the tail holds it. */
const CASE_BOX: CSSProperties = {
  left: "-0.425%",
  top: "43.939%",
  width: "23.629%",
  height: "34.666%",
};
/** In the claws: moved right by 210% of its width, down 7.9% of its height, a bit closer (bigger). */
const HELD = "translate(210%, 6%) rotate(0deg) scale(1.22)";
const ON_TAIL = "translate(0%, 0%) rotate(0deg) scale(1)";
const MID_AIR = "translate(108%, -6%) rotate(-7deg) scale(1.1)";
/** Where the light comes from in the frame. */
const LIGHT = { x: "61%", y: "59%" };

/** Inside the case box, coordinates are the source art's pixels (500 × 815). */
const TOP_FACE = "8,272 470,254 486,328 150,368 10,296";
const LATCHES = [
  { x: 168, y: 386 },
  { x: 418, y: 352 },
] as const;
/**
 * The claw-hands are a 6-frame sprite drawn in Gemini from the artwork's own claws: open, curling,
 * half closed, almost closed, gripping, squeezing. Frames sit side by side in one sheet.
 */
const PAW_FRAMES = 6;
const pawFrame = (i: number): Keyframe => ({
  backgroundPosition: `${(i / (PAW_FRAMES - 1)) * 100}% 0%`,
  easing: "steps(1, end)",
});
/** Paws rise out of the cape from here as the case arrives. */
const TUCKED = "translateY(45%) scale(0.85)";

/** A four-point sparkle. */
function Sparkle({
  x,
  y,
  size,
}: {
  x: string;
  y: string;
  size: string;
}): ReactElement {
  return (
    <svg
      data-part="sparkle"
      viewBox="-10 -10 20 20"
      className="pointer-events-none absolute opacity-0"
      style={{ left: x, top: y, width: size, translate: "-50% -50%" }}
      aria-hidden="true"
    >
      <path
        d="M0 -10 Q1.2 -1.2 10 0 Q1.2 1.2 0 10 Q-1.2 1.2 -10 0 Q-1.2 -1.2 0 -10 Z"
        fill="#fff6cf"
      />
    </svg>
  );
}

/**
 * The case and the claws holding it, in front of the body and behind the head. `rig` is the path
 * prefix of the rig's images (case-body and case-lid are cut from the artwork).
 */
export function BriefcaseProps({ rig }: { rig: string }): ReactElement {
  const layer = (name: string): CSSProperties => ({
    backgroundImage: `url(${rig}-${name}.webp)`,
    backgroundSize: "100% 100%",
  });
  return (
    <span
      data-part="case"
      className="pointer-events-none absolute opacity-0"
      style={{ ...CASE_BOX, transformOrigin: "50% 50%" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 815"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="dino-case-lining" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="0.35" stopColor="#e3a52a" />
            <stop offset="1" stopColor="#3b2a0e" />
          </linearGradient>
          <radialGradient id="dino-case-core" cx="0.5" cy="0.55" r="0.6">
            <stop offset="0" stopColor="#fffef4" />
            <stop offset="0.4" stopColor="#ffe692" />
            <stop offset="1" stopColor="#f2a516" />
          </radialGradient>
        </defs>
        {/* The open lid's lining, standing up behind the opening */}
        <g
          data-part="lining"
          style={{ transformOrigin: "240px 263px", transform: "scale(1, 0)" }}
        >
          <polygon
            points="8,272 470,254 452,36 30,62"
            fill="url(#dino-case-lining)"
            stroke={INK}
            strokeWidth={20}
            strokeLinejoin="round"
          />
          <polygon
            points="30,62 452,36 450,62 32,88"
            fill="#2e2e2e"
            stroke={INK}
            strokeWidth={10}
            strokeLinejoin="round"
          />
        </g>
      </svg>
      {/* The case body from the artwork; the paws slide out from behind it */}
      <span className="absolute inset-0 z-[1]" style={layer("case-body")} />
      <svg
        viewBox="0 0 500 815"
        className="absolute inset-0 z-[1] h-full w-full overflow-visible"
      >
        {/* Light from inside, where the top face was */}
        <g data-part="opening" opacity={0}>
          <polygon
            points={TOP_FACE}
            fill="#1c1409"
            stroke={INK}
            strokeWidth={20}
            strokeLinejoin="round"
          />
          <polygon
            points="34,283 456,268 466,318 160,350 40,300"
            fill="url(#dino-case-core)"
          />
        </g>
        {/* Latches on the front, popped when the paws squeeze */}
        {LATCHES.map((l) => (
          <g key={l.x} transform={`translate(${l.x} ${l.y})`}>
            <g data-part="latch" style={{ transformOrigin: "0px -14px" }}>
              <rect
                x={-26}
                y={-14}
                width={52}
                height={36}
                rx={8}
                fill="#a9a9a3"
                stroke={INK}
                strokeWidth={10}
              />
              <path
                d="M-14 -2 H14"
                stroke="#e8e8e2"
                strokeWidth={6}
                strokeLinecap="round"
              />
            </g>
          </g>
        ))}
      </svg>
      {/* The lid: top face and handle, folding back from its rear edge */}
      <span
        data-part="case-lid"
        className="absolute inset-0 z-[1]"
        style={{ ...layer("case-lid"), transformOrigin: "50% 32.3%" }}
      />
      {/*
        Claw-hands (the right one mirrored). They come out of the cape's front opening behind the
        case, slide out to its sides, then step in front of it so the claws close over its edges.
      */}
      {[false, true].map((mirror) => (
        <span
          key={String(mirror)}
          data-part="paw-reach"
          className="absolute z-0 aspect-[200/231] w-[80%] opacity-0"
          style={{
            left: mirror ? "58%" : "-38%",
            top: "30%",
            transformOrigin: "50% 100%",
          }}
        >
          <span
            data-part="paw"
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${rig}-paw-sheet.webp)`,
              backgroundSize: `${PAW_FRAMES * 100}% 100%`,
              backgroundPosition: "0% 0%",
              transform: mirror ? "scaleX(-1)" : undefined,
            }}
          />
        </span>
      ))}
    </span>
  );
}

/** The light from the case, drawn over the whole dino: a glow, rays rising out of it, sparkles. */
export function BriefcaseLight(): ReactElement {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span
        data-part="halo"
        className="absolute aspect-square w-[120%] rounded-full opacity-0 [background:radial-gradient(circle,rgb(255_222_120/0.6)_0%,rgb(255_196_60/0.28)_28%,rgb(255_180_40/0)_62%)]"
        style={{ left: LIGHT.x, top: LIGHT.y, translate: "-50% -50%" }}
      />
      {/* Rays only rise out of the opening: the box is clipped to the top half of the light */}
      <span
        className="absolute h-[60%] w-[150%] overflow-hidden"
        style={{ left: LIGHT.x, top: LIGHT.y, translate: "-50% -100%" }}
      >
        <span
          data-part="rays"
          className="absolute top-full left-1/2 aspect-square w-full rounded-full opacity-0 [background:repeating-conic-gradient(from_0deg,rgb(255_226_140/0.36)_0deg_4deg,rgb(255_226_140/0)_4deg_15deg)] [mask-image:radial-gradient(circle,#000_8%,rgb(0_0_0/0.6)_30%,transparent_62%)]"
        />
      </span>
      <Sparkle x="50%" y="48%" size="5%" />
      <Sparkle x="68%" y="45%" size="4%" />
      <Sparkle x="58%" y="40%" size="3%" />
      <Sparkle x="74%" y="53%" size="3.5%" />
    </span>
  );
}

/**
 * Light on the dino itself, placed inside its head layer: a warm wash on the face from below, cut to
 * the head's silhouette, and a gold reflection in the goggle glass.
 */
export function BriefcaseFaceLight({
  headMask,
  glassMask,
}: {
  headMask: string;
  glassMask: string;
}): ReactElement {
  const masked = (url: string): CSSProperties => ({
    maskImage: `url(${url})`,
    maskSize: "100% 100%",
    WebkitMaskImage: `url(${url})`,
    WebkitMaskSize: "100% 100%",
  });
  return (
    <>
      <span
        data-part="face-light"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay [background:radial-gradient(circle_at_61%_63%,rgb(255_214_90/1)_0%,rgb(255_190_50/0.7)_16%,rgb(255_170_30/0)_42%)]"
        style={masked(headMask)}
      />
      <span
        data-part="glass-light"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen [background:linear-gradient(to_top,rgb(255_205_80/0.95),rgb(255_220_130/0.5))]"
        style={masked(glassMask)}
      />
    </>
  );
}

type Step = readonly [ms: number, frame: Keyframe];

/** Total length of the scene, in ms. */
export const SCENE_MS = 7000;
/** When the lid shuts, in ms: the dino says its line just after. */
export const LID_SHUT_MS = 5050;

const SMOOTH = "cubic-bezier(0.45, 0, 0.25, 1)";
const OUT = "cubic-bezier(0.2, 0.7, 0.3, 1)";
const SNAP = "cubic-bezier(0.2, 0.9, 0.3, 1.25)";

/** Animates elements through timed steps over the whole scene; `stagger` delays each one more. */
function track(
  targets: readonly (Element | null | undefined)[],
  steps: readonly Step[],
  stagger = 0,
): void {
  const frames = steps.map(([ms, frame]) => ({
    ...frame,
    offset: Math.min(ms / SCENE_MS, 1),
  }));
  targets.forEach((el, i) => {
    el?.animate(frames, {
      duration: SCENE_MS,
      delay: i * stagger,
      easing: "linear",
    });
  });
}

const all = (root: HTMLElement, part: string): Element[] =>
  Array.from(root.querySelectorAll(`[data-part="${part}"]`));

/**
 * Plays the briefcase scene on a dino rendered with {@link BriefcaseProps}, {@link BriefcaseLight}
 * and {@link BriefcaseFaceLight}. `tailNoCase` is the tail without its case, swapped in while the
 * case is in the claws; `lids` are the eyelids behind the goggles.
 */
export function playBriefcase(
  root: HTMLElement,
  rig: {
    tail: HTMLElement | null;
    tailNoCase: HTMLElement | null;
    head: HTMLElement | null;
    jaw: HTMLElement | null;
    body: HTMLElement | null;
    lids: readonly Element[];
  },
): void {
  const rot = (deg: number, easing = SMOOTH): Keyframe => ({
    transform: `rotate(${deg}deg)`,
    easing,
  });
  const LEAVE = 260; // the case leaves the tail
  const BACK = 6250; // and lands on it again

  // Tail: a small dip, a soft flick that sends the case off, a settle; then it takes it back
  track(
    [rig.tail, rig.tailNoCase],
    [
      [0, rot(0)],
      [180, rot(3)],
      [LEAVE, rot(-7, OUT)],
      [700, rot(2)],
      [1100, rot(0)],
      [6050, rot(0)],
      [BACK, rot(-4, OUT)],
      [6600, rot(2)],
      [SCENE_MS, rot(0)],
    ],
  );
  // Which tail shows: without the case from LEAVE to BACK
  const shown = (on: number, off: number): Step[] => [
    [0, { opacity: on }],
    [LEAVE, { opacity: on }],
    [LEAVE + 1, { opacity: off }],
    [BACK, { opacity: off }],
    [BACK + 1, { opacity: on }],
    [SCENE_MS, { opacity: on }],
  ];
  track([rig.tail], shown(1, 0));
  track([rig.tailNoCase], shown(0, 1));

  // Body: a wind-up before the flick, a little squash when the case lands in its claws
  track(
    [rig.body],
    [
      [0, { transform: "none", easing: SMOOTH }],
      [180, { transform: "scale(1.015, 0.98)", easing: OUT }],
      [400, { transform: "scale(0.995, 1.01)", easing: SMOOTH }],
      [700, { transform: "none" }],
      [1150, { transform: "none", easing: OUT }],
      [1230, { transform: "scale(1.01, 0.985)", easing: SMOOTH }],
      [1450, { transform: "none" }],
      [SCENE_MS, { transform: "none" }],
    ],
  );

  // The case: off the tail, in an arc over the front, into the claws; back the same way later
  track(
    [root.querySelector('[data-part="case"]')],
    [
      [0, { opacity: 0, transform: ON_TAIL }],
      [LEAVE, { opacity: 0, transform: ON_TAIL }],
      [LEAVE + 1, { opacity: 1, transform: ON_TAIL, easing: OUT }],
      [640, { opacity: 1, transform: MID_AIR, easing: SMOOTH }],
      [
        1000,
        {
          opacity: 1,
          transform: "translate(212%, 4%) rotate(3deg) scale(1.23)",
          easing: SMOOTH,
        },
      ],
      [1180, { opacity: 1, transform: HELD, easing: SMOOTH }],
      [1500, { opacity: 1, transform: HELD, easing: SMOOTH }],
      [
        1600,
        {
          opacity: 1,
          transform: "translate(210%, 7%) rotate(0deg) scale(1.23, 1.2)",
          easing: SMOOTH,
        },
      ],
      [1740, { opacity: 1, transform: HELD }],
      [5860, { opacity: 1, transform: HELD, easing: SMOOTH }],
      [6060, { opacity: 1, transform: MID_AIR, easing: SMOOTH }],
      [BACK, { opacity: 1, transform: ON_TAIL }],
      [BACK + 1, { opacity: 0, transform: ON_TAIL }],
      [SCENE_MS, { opacity: 0, transform: ON_TAIL }],
    ],
  );

  // Paws rise out of the cape as the case arrives and sink back after letting go
  // The cape drops over the front claws that peek out under it, so the paws seem to come from
  // there and the dino never has four hands
  track(all(root, "capepatch"), [
    [0, { opacity: 0 }],
    [980, { opacity: 0, easing: SMOOTH }],
    [1200, { opacity: 1 }],
    [5640, { opacity: 1, easing: SMOOTH }],
    [5860, { opacity: 0 }],
    [SCENE_MS, { opacity: 0 }],
  ]);
  const [leftReach, rightReach] = all(root, "paw-reach");
  const reach = (tuckX: string): Step[] => [
    [0, { opacity: 0, transform: `translateX(${tuckX})`, zIndex: 0 }],
    [
      980,
      { opacity: 0, transform: `translateX(${tuckX})`, zIndex: 0, easing: OUT },
    ],
    [
      1000,
      { opacity: 1, transform: `translateX(${tuckX})`, zIndex: 0, easing: OUT },
    ],
    [1260, { opacity: 1, transform: "translateX(0%)", zIndex: 0 }],
    [1261, { opacity: 1, transform: "translateX(0%)", zIndex: 2 }],
    [5620, { opacity: 1, transform: "translateX(0%)", zIndex: 2 }],
    [
      5621,
      { opacity: 1, transform: "translateX(0%)", zIndex: 0, easing: SMOOTH },
    ],
    [5820, { opacity: 1, transform: `translateX(${tuckX})`, zIndex: 0 }],
    [5840, { opacity: 0, transform: `translateX(${tuckX})`, zIndex: 0 }],
    [SCENE_MS, { opacity: 0, transform: `translateX(${tuckX})`, zIndex: 0 }],
  ];
  track([leftReach], reach("58%"));
  track([rightReach], reach("-58%"));

  // Sprite frames: open as they arrive, close round the case one frame at a time, squeeze as the
  // latches pop, tremble in the light, open again to let go
  const paw: Step[] = [
    [0, pawFrame(0)],
    [1300, pawFrame(1)],
    [1390, pawFrame(2)],
    [1480, pawFrame(3)],
    [1570, pawFrame(4)],
    [1760, pawFrame(5)],
    [1900, pawFrame(4)],
    [1940, pawFrame(5)],
    [2080, pawFrame(4)],
    [2450, pawFrame(3)],
    [2560, pawFrame(4)],
    [3150, pawFrame(5)],
    [3230, pawFrame(4)],
    [3330, pawFrame(5)],
    [3410, pawFrame(4)],
    [5300, pawFrame(3)],
    [5390, pawFrame(2)],
    [5480, pawFrame(1)],
    [5570, pawFrame(0)],
    [SCENE_MS, pawFrame(0)],
  ];
  track(all(root, "paw"), paw, 40);
  const [leftLatch, rightLatch] = all(root, "latch");
  const latch = (at: number, shut: number): Step[] => [
    [0, rot(0)],
    [at, rot(0, SNAP)],
    [at + 90, rot(-42)],
    [shut, rot(-42, SNAP)],
    [shut + 80, rot(0)],
    [SCENE_MS, rot(0)],
  ];
  track([leftLatch], latch(1770, 5250));
  track([rightLatch], latch(1950, 5300));

  // The lid cracks open (light leaks out), a held breath, then it swings up; it snaps shut later
  track(all(root, "case-lid"), [
    [0, { transform: "scale(1, 1)" }],
    [2300, { transform: "scale(1, 1)", easing: OUT }],
    [2420, { transform: "translateY(-3%) scale(1, 0.72)" }],
    [2800, { transform: "translateY(-3%) scale(1, 0.7)", easing: SMOOTH }],
    [3000, { transform: "scale(1, 0)" }],
    [4900, { transform: "scale(1, 0)", easing: SMOOTH }],
    [LID_SHUT_MS, { transform: "scale(1, 1.06)", easing: OUT }],
    [LID_SHUT_MS + 90, { transform: "scale(1, 1)" }],
    [SCENE_MS, { transform: "scale(1, 1)" }],
  ]);
  track(all(root, "lining"), [
    [0, { transform: "scale(1, 0)" }],
    [2300, { transform: "scale(1, 0)", easing: OUT }],
    [2420, { transform: "scale(1, 0.12)" }],
    [2800, { transform: "scale(1, 0.14)", easing: SNAP }],
    [3060, { transform: "scale(1, 1)" }],
    [4880, { transform: "scale(1, 1)", easing: SMOOTH }],
    [LID_SHUT_MS - 20, { transform: "scale(1, 0)" }],
    [SCENE_MS, { transform: "scale(1, 0)" }],
  ]);
  track(all(root, "opening"), [
    [0, { opacity: 0 }],
    [2300, { opacity: 0 }],
    [2420, { opacity: 0.55 }],
    [2800, { opacity: 0.6 }],
    [2900, { opacity: 1 }],
    [4950, { opacity: 1 }],
    [LID_SHUT_MS - 20, { opacity: 0 }],
    [SCENE_MS, { opacity: 0 }],
  ]);

  // The light: a thin leak while the lid is cracked, a flash as it swings open, a slow breathing
  // glow, then cut when it shuts
  const glow = (peak: number): Step[] => [
    [0, { opacity: 0 }],
    [2320, { opacity: 0, easing: OUT }],
    [2450, { opacity: peak * 0.3 }],
    [2800, { opacity: peak * 0.35, easing: SNAP }],
    [3050, { opacity: peak * 1.15 }],
    [3300, { opacity: peak, easing: SMOOTH }],
    [3850, { opacity: peak * 0.82, easing: SMOOTH }],
    [4400, { opacity: peak, easing: SMOOTH }],
    [4900, { opacity: peak * 0.9 }],
    [LID_SHUT_MS, { opacity: 0 }],
    [SCENE_MS, { opacity: 0 }],
  ];
  track(all(root, "halo"), glow(1));
  track(all(root, "face-light"), glow(0.9));
  track(all(root, "glass-light"), glow(0.75));
  track(all(root, "rays"), [
    [
      0,
      {
        opacity: 0,
        transform: "translate(-50%, -50%) rotate(0deg) scale(0.5)",
      },
    ],
    [
      2850,
      {
        opacity: 0,
        transform: "translate(-50%, -50%) rotate(0deg) scale(0.5)",
        easing: SNAP,
      },
    ],
    [
      3200,
      {
        opacity: 0.8,
        transform: "translate(-50%, -50%) rotate(8deg) scale(1)",
      },
    ],
    [
      4900,
      {
        opacity: 0.65,
        transform: "translate(-50%, -50%) rotate(24deg) scale(1.04)",
      },
    ],
    [
      LID_SHUT_MS,
      {
        opacity: 0,
        transform: "translate(-50%, -50%) rotate(25deg) scale(0.9)",
      },
    ],
    [
      SCENE_MS,
      {
        opacity: 0,
        transform: "translate(-50%, -50%) rotate(25deg) scale(0.9)",
      },
    ],
  ]);
  all(root, "sparkle").forEach((el, i) => {
    const steps: Step[] = [
      [0, { opacity: 0, transform: "scale(0) rotate(0deg)" }],
    ];
    for (let t = 3100 + i * 260; t + 650 < 4950; t += 900) {
      steps.push([
        t,
        { opacity: 0, transform: "scale(0) rotate(0deg)", easing: SMOOTH },
      ]);
      steps.push([
        t + 300,
        { opacity: 1, transform: "scale(1) rotate(45deg)", easing: SMOOTH },
      ]);
      steps.push([
        t + 650,
        { opacity: 0, transform: "scale(0.2) rotate(90deg)" },
      ]);
    }
    steps.push([SCENE_MS, { opacity: 0, transform: "scale(0)" }]);
    track([el], steps);
  });

  // Head: leans over the case, recoils a touch at the flash, leans in to stare; straightens after
  track(
    [rig.head],
    [
      [0, rot(0)],
      [1050, rot(0)],
      [1600, rot(5.5)],
      [2900, rot(5.5, OUT)],
      [3060, rot(1.5)],
      [3500, rot(4)],
      [5000, rot(4)],
      [5700, rot(0)],
      [SCENE_MS, rot(0)],
    ],
  );
  // Jaw: drops at the flash, hangs open, closes as the lid does
  track(
    [rig.jaw],
    [
      [0, rot(0)],
      [3000, rot(0, SNAP)],
      [3200, rot(12)],
      [4900, rot(10)],
      [LID_SHUT_MS + 60, rot(0)],
      [SCENE_MS, rot(0)],
    ],
  );
  // Gaze: the lids lower as it studies the case, narrow at the crack of light, fly open at the
  // flash, and a slow blink once the lid has shut
  const lid = (y: number, easing = SMOOTH): Keyframe => ({
    transform: `translateY(${y}%)`,
    easing,
  });
  track(rig.lids, [
    [0, lid(-104)],
    [1200, lid(-104)],
    [1550, lid(-56)],
    [2400, lid(-56)],
    [2600, lid(-44)],
    [2950, lid(-44, OUT)],
    [3080, lid(-104)],
    [5150, lid(-104)],
    [5300, lid(0)],
    [5420, lid(0)],
    [5600, lid(-104)],
    [SCENE_MS, lid(-104)],
  ]);
}
