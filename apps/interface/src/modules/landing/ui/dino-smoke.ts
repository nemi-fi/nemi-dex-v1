/**
 * A short exhale of smoke from the dino's nostril, drawn as soft particles on a canvas.
 *
 * Two quick puffs ("pff, pff") shoot forward out of the nostril, slow down, rise, swell and fade,
 * with a gentle wobble so the wisps never move in straight lines. Frames are drawn only while
 * smoke is in the air; the canvas is cleared and the loop stops when the last wisp is gone.
 */

/** Where the nostril sits in the canvas, as a share of its width and height. */
export interface SmokeOrigin {
  readonly x: number;
  readonly y: number;
}

interface Wisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  readonly life: number;
  readonly r0: number;
  readonly r1: number;
  readonly peak: number;
  readonly seed: number;
}

/** Two puffs: start and length in seconds, particles per second. */
const BURSTS = [
  { start: 0, length: 0.24, rate: 130 },
  { start: 0.4, length: 0.3, rate: 110 },
] as const;

/** Soft round sprite, drawn once per colour and reused for every particle. */
const sprites = new Map<string, HTMLCanvasElement>();

function sprite(rgb: string): HTMLCanvasElement {
  const cached = sprites.get(rgb);
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, `rgb(${rgb} / 1)`);
    g.addColorStop(0.35, `rgb(${rgb} / 0.75)`);
    g.addColorStop(0.7, `rgb(${rgb} / 0.25)`);
    g.addColorStop(1, `rgb(${rgb} / 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  sprites.set(rgb, canvas);
  return canvas;
}

/**
 * Plays one exhale on `canvas`. `origin` is the nostril; `dark` picks a light smoke for dark
 * backgrounds. Returns a function that stops it early (e.g. on unmount).
 */
export function exhale(
  canvas: HTMLCanvasElement,
  origin: SmokeOrigin,
  dark: boolean,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  // Match the backing store to the displayed size, for crisp wisps on retina screens
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  const W = canvas.width;
  const H = canvas.height;
  const ox = origin.x * W;
  const oy = origin.y * H;
  // Everything is scaled to the canvas width, so the smoke looks the same at any dino size
  const u = W;

  const tint = sprite(dark ? "236 236 232" : "128 128 122");
  const wisps: Wisp[] = [];
  const emitted = BURSTS.map(() => 0);
  let elapsed = 0;
  let last = performance.now();
  let frame = 0;

  const spawn = (burst: number): void => {
    // Out of the nostril: forward and a little up, fanning out slightly
    const angle = -0.3 + (Math.random() - 0.5) * 0.55;
    const speed = u * (0.85 + Math.random() * 0.5) * (burst === 0 ? 1.1 : 0.9);
    wisps.push({
      x: ox + (Math.random() - 0.5) * u * 0.008,
      y: oy + (Math.random() - 0.5) * u * 0.008,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 1.5 + Math.random() * 0.9,
      r0: u * (0.012 + Math.random() * 0.01),
      r1: u * (0.09 + Math.random() * 0.08),
      peak: 0.16 + Math.random() * 0.12,
      seed: Math.random() * Math.PI * 2,
    });
  };

  const step = (now: number): void => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    elapsed += dt;

    BURSTS.forEach((b, i) => {
      if (elapsed < b.start) return;
      const due = Math.floor(Math.min(elapsed - b.start, b.length) * b.rate);
      for (; (emitted[i] ?? 0) < due; emitted[i] = (emitted[i] ?? 0) + 1)
        spawn(i);
    });

    ctx.clearRect(0, 0, W, H);
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      if (!w) continue;
      w.age += dt;
      const p = w.age / w.life;
      if (p >= 1) {
        wisps.splice(i, 1);
        continue;
      }
      // Air drag slows the jet, warmth lifts it, and a slow sway curls it
      const drag = Math.exp(-2.2 * dt);
      w.vx *= drag;
      w.vy = w.vy * drag - u * 0.32 * dt;
      w.x += w.vx * dt + Math.sin(w.age * 2.6 + w.seed) * u * 0.05 * dt;
      w.y += w.vy * dt + Math.cos(w.age * 2.1 + w.seed) * u * 0.03 * dt;

      const r = w.r0 + (w.r1 - w.r0) * (1 - (1 - p) * (1 - p));
      const fadeIn = Math.min(p / 0.12, 1);
      const fadeOut = Math.pow(1 - p, 1.7);
      ctx.globalAlpha = w.peak * fadeIn * fadeOut;
      ctx.drawImage(tint, w.x - r, w.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;

    const emitting =
      elapsed < (BURSTS.at(-1)?.start ?? 0) + (BURSTS.at(-1)?.length ?? 0);
    if (emitting || wisps.length > 0) {
      frame = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  };

  frame = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);
  };
}
