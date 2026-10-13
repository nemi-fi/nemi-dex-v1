import { useEffect, useRef } from "react";

export function useMounted() {
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
}
