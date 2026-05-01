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
        bg-white/20 hover:bg-white/30
        backdrop-blur-sm border border-white/30
        flex items-center justify-center
        text-white transition-all duration-200
        hover:scale-110 active:scale-95
        shadow-lg
      "
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-300" />
      ) : (
        <Moon className="w-4 h-4 text-white" />
      )}
    </button>
  );
}
