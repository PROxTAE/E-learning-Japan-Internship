"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField, Input, Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLang } from "@/lib/i18n/LanguageContext";
import {
  OrangeFlowerCharacter,
  OliveBlobCharacter,
  LimeStarCharacter,
  GreenDropletCharacter,
  GradFlowerCharacter,
} from "@/components/shared/ThemeCharacters";

export default function Home() {
  const router = useRouter();
  const { t } = useLang();
  const [accessCode, setAccessCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      router.push(`/play/${accessCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto select-none bg-bg-primary">
      {/* Floating retro illustration characters in corners */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-90 dark:opacity-80">
        {/* Top Left: Orange Flower Character */}
        <div className="absolute -top-6 -left-6 sm:top-10 sm:left-10 transform -rotate-12 hover:rotate-3 transition-transform duration-300">
          <OrangeFlowerCharacter size={160} />
        </div>

        {/* Bottom Right: Olive Blob Character */}
        <div className="absolute -bottom-10 -right-10 sm:bottom-10 sm:right-10 transform rotate-12 hover:-rotate-3 transition-transform duration-300">
          <OliveBlobCharacter size={160} />
        </div>

        {/* Peeking Left: Lime Star Character */}
        <div className="absolute left-[-40px] top-[40%] transform rotate-45 hidden md:block">
          <LimeStarCharacter size={110} />
        </div>

        {/* Peeking Right: Green Droplet Character */}
        <div className="absolute right-[-30px] top-[30%] transform -rotate-12 hidden md:block">
          <GreenDropletCharacter size={110} />
        </div>
      </div>

      {/* Floating controls: Language + Theme */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* Centred content */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-16 text-center gap-6 sm:gap-8">
        
        {/* Brand Icon: graduation cap character badge */}
        <div className="transform rotate-3 hover:rotate-[-3deg] transition-transform duration-300 cursor-pointer">
          <GradFlowerCharacter size={120} />
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-2 sm:gap-3 max-w-xs sm:max-w-sm">
          <h1 className="text-4xl sm:text-5xl font-black text-text-main leading-tight tracking-tight uppercase">
            {t.play.homeTitle.split(" ").slice(0, -1).join(" ")}<br />{t.play.homeTitle.split(" ").slice(-1)[0]}
          </h1>
          <p className="text-text-muted font-bold text-sm sm:text-base tracking-wide">
            {t.play.homeSubtitle}
          </p>
        </div>

        {/* Join form with neo-brutalism retro shadow card style */}
        <form
          onSubmit={handleJoin}
          className="w-full max-w-xs sm:max-w-sm bg-bg-card p-6 rounded-[24px] retro-card flex flex-col gap-4 shadow-xl transition-all"
        >
          <TextField className="w-full">
            <Input
              suppressHydrationWarning
              placeholder={t.play.enterCode}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="text-center text-xl font-black tracking-widest uppercase bg-bg-secondary border-3 border-text-main hover:border-brand-primary focus:border-brand-primary rounded-[16px] h-14 w-full outline-none transition-all text-text-main placeholder:text-text-muted/65"
            />
          </TextField>
          <Button
            type="submit"
            size="lg"
            className="w-full font-black bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full h-14 flex items-center justify-center gap-2 transition-all retro-btn cursor-pointer"
            isDisabled={!accessCode.trim()}
          >
            {t.play.joinQuiz} <ArrowRight className="w-5 h-5 stroke-[3]" />
          </Button>
        </form>

        <div className="flex items-center gap-4 w-full max-w-xs sm:max-w-sm my-1">
          <div className="h-[3px] bg-text-main flex-1 opacity-70" />
          <span className="text-text-main text-sm font-black uppercase tracking-widest">OR</span>
          <div className="h-[3px] bg-text-main flex-1 opacity-70" />
        </div>

        {/* CTA button to Teacher Dashboard using retro border shadow style */}
        <Link href="/teacher/dashboard" className="w-full max-w-xs sm:max-w-sm">
          <button
            suppressHydrationWarning
            className="
              w-full py-4 rounded-[16px]
              bg-bg-card text-text-main font-black text-lg sm:text-xl
              border-3 border-text-main shadow-[4px_4px_0px_0px_var(--theme-text-main)]
              hover:bg-bg-secondary hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--theme-text-main)]
              active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--theme-text-main)]
              transition-all duration-100 cursor-pointer
            "
          >
            {t.play.teacherPortal}
          </button>
        </Link>
      </div>
    </div>
  );
}
