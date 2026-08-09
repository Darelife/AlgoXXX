import { useEffect, useState } from "react";

interface WindowSize {
  width: number;
  height: number;
}

// SSR-safe window size hook. `window` is undefined during any server
// render, so we default to { width: 0, height: 0 } until mounted, then
// keep it in sync with the viewport via a resize listener.
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
