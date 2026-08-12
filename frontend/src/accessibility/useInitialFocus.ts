import { useEffect, useRef } from "react";

export function useInitialFocus<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const animationFrame = window.requestAnimationFrame(() => {
      ref.current?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [enabled]);

  return ref;
}
