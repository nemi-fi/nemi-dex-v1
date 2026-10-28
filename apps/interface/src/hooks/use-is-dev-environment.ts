"use client";

import { useEffect, useState } from "react";

export function useIsDevEnvironment() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const isDevHost = ["localhost", "workers.dev", "127.0.0.1"].some((host) =>
      window.location.hostname.includes(host),
    );
    setIsDev(isDevHost);
  }, []);

  return isDev;
}
