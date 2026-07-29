import { useEffect } from "react";
import { useAuthStore } from "../features/auth/auth-store";

/**
 * Applies the signed-in user's `settingTheme` ('light' | 'dark' | 'system')
 * to <html> as a `dark` class, which the `dark:` variant defined in
 * index.css (via @custom-variant) keys off of. Call this once, high up in
 * the tree (App.tsx) — components themselves don't need to know about it,
 * they just use `dark:` utility classes as usual.
 */
export function useThemeSync() {
  const theme = useAuthStore((state) => state.user?.settingTheme ?? "system");

  useEffect(() => {
    const root = document.documentElement;

    function applySystemPreference() {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    }

    if (theme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (theme === "light") {
      root.classList.remove("dark");
      return;
    }

    // theme === 'system': follow the OS setting, and keep following it if
    // the user changes their OS preference while the tab stays open.
    applySystemPreference();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applySystemPreference);
    return () => media.removeEventListener("change", applySystemPreference);
  }, [theme]);
}
