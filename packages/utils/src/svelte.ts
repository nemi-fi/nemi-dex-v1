import { persisted } from "svelte-persisted-store";
// @ts-ignore
import * as $ from "svelte/internal/client";
import { fromStore } from "svelte/store";

export { fromStore } from "svelte/store";

export function state<T>(x: T): { current: T } {
  const value = $.state(proxy(x));
  return {
    get current() {
      return $.get(value);
    },
    set current(v) {
      $.set(value, proxy(v));
    },
  };
}

export function proxy<T>(x: T): T {
  return $.proxy(x);
}

export function derived<T>(f: () => T): { readonly current: T } {
  const value = $.derived(f);
  return {
    get current() {
      return $.get(value);
    },
  };
}

export function effect(fn: () => void | (() => void)) {
  return $.user_effect(fn);
}
effect.root = $.effect_root;

export function persistedState<T>(
  key: string,
  initialValue: T,
): { current: T } {
  return fromStore(persisted(key, initialValue));
}
