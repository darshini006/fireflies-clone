import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

// The theme lives on <html class="dark"> (set before first paint by the script in layout.tsx).
// Reading it from there keeps every component that calls useTheme() in sync.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage can be blocked (private mode); the choice still applies for this visit
    }
  }, []);

  const toggle = useCallback(() => setTheme(getSnapshot() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggle };
}
