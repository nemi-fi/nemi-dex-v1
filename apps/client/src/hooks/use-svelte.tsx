import { sutils } from "@nemi-fi/utils";
import { useEffect, useState } from "react";

export function useSvelte<T>(svelteState: () => T): T {
  const [state, setState] = useState(svelteState());
  useEffect(() => {
    const cleanup = sutils.svelte.effect.root(() => {
      sutils.svelte.effect(() => {
        setState(svelteState());
      });
    });
    return cleanup;
  }, []);
  return state;
}
