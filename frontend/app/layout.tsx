import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai, Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

/* ── Fonts — universal stack covering all supported scripts ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
  preload: false,
});

const notoJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
  preload: false,
});

const notoKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-kr",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "E-Learning Quiz",
  description: "Interactive quiz platform for e-learning",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${notoThai.variable} ${notoJP.variable} ${notoKR.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            {children}

          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
