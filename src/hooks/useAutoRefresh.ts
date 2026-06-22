import { useEffect, useRef } from "react";

/**
 * Calls `callback` every time the global auto-refresh tick fires (every 30 s).
 * Always uses the latest version of `callback` via a ref — safe to pass inline functions.
 */
export function useAutoRefresh(callback: () => void) {
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(() => {
    function handler() {
      if (!document.hidden) ref.current();
    }
    window.addEventListener("auto-refresh", handler);
    return () => window.removeEventListener("auto-refresh", handler);
  }, []);
}
