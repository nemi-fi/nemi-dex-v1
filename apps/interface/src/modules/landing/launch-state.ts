/**
 * Whether swaps work on mainnet. The contracts are deployed, but tokens with more than 6 decimals
 * (bridged ETH) are not supported yet, so the landing says "Opening soon" instead of "live".
 * Flip to `true` on the day the first real swap goes through.
 */
export const SWAPS_OPEN: boolean = false;

/** The waitlist form on Tally (email, optional X/Telegram handle, first swap). */
export const WAITLIST_URL = "https://tally.so/r/o9EQq5";

/** Id of the waitlist form in the hero, so every "Join the waitlist" button can scroll to it. */
export const WAITLIST_ANCHOR = "waitlist";

/** What the dino says on each click before launch; it gets a little tired of being poked. */
export const NOT_YET_LINES = [
  "Not yet.",
  "Still not yet.",
  "Soon. Promise.",
  "Poking won't help.",
  "Leave your email instead.",
] as const;
