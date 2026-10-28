import { useMediaQuery } from "./use-media-query.js";

/** True below `breakpoint` px (Tailwind's `md` by default). */
export function useIsMobile(breakpoint = 768) {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
