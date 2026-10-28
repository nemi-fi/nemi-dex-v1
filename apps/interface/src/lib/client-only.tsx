import {
  lazy,
  Suspense,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";

/**
 * Lazily loads a component and renders it only in the browser, showing `loading` during SSR,
 * hydration and while the component's code loads. Replacement for `next/dynamic` with `ssr: false`.
 */
export function clientOnly<P extends object>(
  load: () => Promise<ComponentType<P>>,
  { loading }: { loading: () => ReactNode },
) {
  const Component = lazy(async () => ({ default: await load() }));
  return function ClientOnly(props: P) {
    const hydrated = useSyncExternalStore(
      subscribeNoop,
      () => true,
      () => false,
    );
    if (!hydrated) {
      return loading();
    }
    return (
      <Suspense fallback={loading()}>
        <Component {...props} />
      </Suspense>
    );
  };
}

function subscribeNoop() {
  return () => {};
}
