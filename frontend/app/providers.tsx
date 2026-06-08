"use client";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { CustomThemeProvider } from "@/components/CustomThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
