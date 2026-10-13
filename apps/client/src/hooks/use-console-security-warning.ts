import { useIsDevEnvironment } from "@/hooks/use-is-dev-environment";
import { useEffect } from "react";

export function useConsoleSecurityWarning() {
  const isDevEnvironment = useIsDevEnvironment();

  useEffect(() => {
    if (isDevEnvironment) {
      return;
    }
    const warn = () => {
      // console.clear();

      const titleStyle = [
        "color: #ff4b2b",
        "font-size: 64px",
        "font-weight: 900",
        "text-shadow: 1px 1px 3px rgba(0,0,0,0.4)",
        "margin: 16px 0",
      ].join(";");

      const messageStyle = [
        "color: #eee",
        "background: #111",
        "font-size: 16px",
        "line-height: 1.6",
        "padding: 16px 20px",
        "border: 1px solid #333",
        "border-radius: 8px",
        "max-width: 600px",
        "font-family: monospace",
      ].join(";");

      console.log("%c⚠️  Warning!", titleStyle);
      console.log(
        "%cYou are reading this message because you opened the browser console, a developer tool. Do not enter or paste code you do not understand. Never share your tokens or any other info with anyone. If someone told you to do this, it is very likely a scam.",
        messageStyle,
      );
    };

    // Simple detection for when DevTools open (not perfect, but good enough)
    let devtoolsOpen = false;
    const threshold = 160;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;
      if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
        devtoolsOpen = true;
        warn();
      } else if (!(widthThreshold || heightThreshold)) {
        devtoolsOpen = false;
      }
    };

    window.addEventListener("resize", detectDevTools);
    detectDevTools();

    return () => window.removeEventListener("resize", detectDevTools);
  }, []);
}
