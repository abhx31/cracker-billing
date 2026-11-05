"use client";

import { useEffect } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, setThemePreference } from "./theme";

export function ThemeToggle() {
  // Bills always print on white paper, even in dark mode.
  useEffect(() => {
    let wasDark = false;
    const before = () => {
      wasDark = document.documentElement.classList.contains("dark");
      if (wasDark) applyTheme("light");
    };
    const after = () => {
      if (wasDark) applyTheme("dark");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    setThemePreference(isDark ? "light" : "dark");
  }

  // Icons switch via the `dark:` CSS variant, so the server render is always
  // correct without knowing the theme.
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
