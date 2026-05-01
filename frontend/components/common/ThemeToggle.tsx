"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="
        relative flex items-center justify-center w-9 h-9 rounded-xl
        bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10
        text-slate-600 dark:text-slate-300
        hover:bg-violet-100 dark:hover:bg-violet-900/30
        hover:text-violet-600 dark:hover:text-violet-400
        hover:border-violet-300 dark:hover:border-violet-700
        transition-all duration-200 backdrop-blur-sm
      "
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
