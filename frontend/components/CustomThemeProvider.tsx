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
  textMain: string;
  textMuted: string;
  border: string;
  radiusCard: string;
  radiusBtn: string;
}

export const lightThemeDefault: ThemeConfig = {
  bg: "#FAF6F0",
  bgSecondary: "#F0E7DC",
  cardBg: "#FFFFFF",
  cardDarkBg: "#1F2229",
  primary: "#D05A3F",
  primaryHover: "#B74C32",
  primaryFg: "#FFFFFF",
  secondary: "#2E6F40",
  secondaryHover: "#225330",
  secondaryFg: "#FFFFFF",
  textMain: "#1C1C24",
  textMuted: "#626673",
  border: "#E6DDD1",
  radiusCard: "24px",
  radiusBtn: "9999px",
};

export const darkThemeDefault: ThemeConfig = {
  bg: "#12141D",
  bgSecondary: "#191C27",
  cardBg: "#212534",
  cardDarkBg: "#0F111A",
  primary: "#FF7A59",
  primaryHover: "#FF9175",
  primaryFg: "#12141D",
  secondary: "#419F67",
  secondaryHover: "#53B87D",
  secondaryFg: "#12141D",
  textMain: "#FAF8F5",
  textMuted: "#9099AF",
  border: "#2A2F45",
  radiusCard: "24px",
  radiusBtn: "9999px",
};

interface CustomThemeContextType {
  config: ThemeConfig;
  updateConfig: (newConfig: Partial<ThemeConfig>) => void;
  resetConfig: () => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within a CustomThemeProvider");
  }
  return context;
}

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>(lightThemeDefault);

  // Load configuration based on the dark/light mode
  useEffect(() => {
    if (resolvedTheme === "dark") {
      setConfig(darkThemeDefault);
    } else {
      setConfig(lightThemeDefault);
    }
  }, [resolvedTheme]);

  // Apply theme config to HTML element as CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Set variables
    root.style.setProperty("--theme-bg", config.bg);
    root.style.setProperty("--theme-bg-secondary", config.bgSecondary);
    root.style.setProperty("--theme-card-bg", config.cardBg);
    root.style.setProperty("--theme-card-dark-bg", config.cardDarkBg);
    root.style.setProperty("--theme-primary", config.primary);
    root.style.setProperty("--theme-primary-hover", config.primaryHover);
    root.style.setProperty("--theme-primary-fg", config.primaryFg);
    root.style.setProperty("--theme-secondary", config.secondary);
    root.style.setProperty("--theme-secondary-hover", config.secondaryHover);
    root.style.setProperty("--theme-secondary-fg", config.secondaryFg);
    root.style.setProperty("--theme-text-main", config.textMain);
    root.style.setProperty("--theme-text-muted", config.textMuted);
    root.style.setProperty("--theme-border", config.border);
    root.style.setProperty("--theme-radius-card", config.radiusCard);
    root.style.setProperty("--theme-radius-btn", config.radiusBtn);
  }, [config]);

  const updateConfig = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(resolvedTheme === "dark" ? darkThemeDefault : lightThemeDefault);
  };

  return (
    <CustomThemeContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </CustomThemeContext.Provider>
  );
}
