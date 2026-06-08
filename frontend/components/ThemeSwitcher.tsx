"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        w-10 h-10 rounded-full
        bg-bg-card border-2 border-theme-border
        flex items-center justify-center
        text-text-main transition-all duration-200
        hover:scale-110 active:scale-95
        shadow-md
      "
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="w-4 h-4 text-text-main" />
      )}
    </button>
  );
}
