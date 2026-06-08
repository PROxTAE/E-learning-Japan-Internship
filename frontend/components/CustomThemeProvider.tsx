"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTheme } from "next-themes";

export interface ThemeConfig {
  bg: string;
  bgSecondary: string;
  cardBg: string;
  cardDarkBg: string;
  primary: string;
  primaryHover: string;
  primaryFg: string;
  secondary: string;
  secondaryHover: string;
  secondaryFg: string;
  accent: string;
  textMain: string;
  textMuted: string;
  border: string;
  radiusCard: string;
  radiusBtn: string;
}

/* ── Light: Y2K Cyber-Anime / Ocean Zine ── */
export const lightThemeDefault: ThemeConfig = {
  bg:             "#F0F4EC",
  bgSecondary:    "#E2EBD6",
  cardBg:         "#FFFFFF",
  cardDarkBg:     "#1A2035",
  primary:        "#00BCD4",
  primaryHover:   "#0097A7",
  primaryFg:      "#0A0A0F",
  secondary:      "#BAFF29",
  secondaryHover: "#9EE010",
  secondaryFg:    "#0A0A0F",
  accent:         "#8C5CF6",
  textMain:       "#0A0A0F",
  textMuted:      "#4A5568",
  border:         "#0A0A0F",
  radiusCard:     "16px",
  radiusBtn:      "9999px",
};

/* ── Dark: Deep Cyber Ocean ── */
export const darkThemeDefault: ThemeConfig = {
  bg:             "#08090F",
  bgSecondary:    "#0E1118",
  cardBg:         "#111827",
  cardDarkBg:     "#050709",
  primary:        "#00E5FF",
  primaryHover:   "#00B8D9",
  primaryFg:      "#08090F",
  secondary:      "#C6FF00",
  secondaryHover: "#AEEA00",
  secondaryFg:    "#08090F",
  accent:         "#A78BFA",
  textMain:       "#F0F4EC",
  textMuted:      "#8896A7",
  border:         "#1E2A3A",
  radiusCard:     "16px",
  radiusBtn:      "9999px",
};

interface CustomThemeContextType {
  config: ThemeConfig;
  updateConfig: (newConfig: Partial<ThemeConfig>) => void;
  resetConfig: () => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (!context) throw new Error("useCustomTheme must be used within a CustomThemeProvider");
  return context;
}

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>(lightThemeDefault);

  useEffect(() => {
    setConfig(resolvedTheme === "dark" ? darkThemeDefault : lightThemeDefault);
  }, [resolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-bg",             config.bg);
    root.style.setProperty("--theme-bg-secondary",   config.bgSecondary);
    root.style.setProperty("--theme-card-bg",        config.cardBg);
    root.style.setProperty("--theme-card-dark-bg",   config.cardDarkBg);
    root.style.setProperty("--theme-primary",        config.primary);
    root.style.setProperty("--theme-primary-hover",  config.primaryHover);
    root.style.setProperty("--theme-primary-fg",     config.primaryFg);
    root.style.setProperty("--theme-secondary",      config.secondary);
    root.style.setProperty("--theme-secondary-hover",config.secondaryHover);
    root.style.setProperty("--theme-secondary-fg",   config.secondaryFg);
    root.style.setProperty("--theme-accent",         config.accent);
    root.style.setProperty("--theme-text-main",      config.textMain);
    root.style.setProperty("--theme-text-muted",     config.textMuted);
    root.style.setProperty("--theme-border",         config.border);
    root.style.setProperty("--theme-radius-card",    config.radiusCard);
    root.style.setProperty("--theme-radius-btn",     config.radiusBtn);
  }, [config]);

  const updateConfig = (newConfig: Partial<ThemeConfig>) =>
    setConfig((prev) => ({ ...prev, ...newConfig }));

  const resetConfig = () =>
    setConfig(resolvedTheme === "dark" ? darkThemeDefault : lightThemeDefault);

  return (
    <CustomThemeContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </CustomThemeContext.Provider>
  );
}
