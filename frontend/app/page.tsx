"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField, Input, Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLang } from "@/lib/i18n/LanguageContext";

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
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      {/* Floating controls: Language + Theme */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* Centred content */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-16 text-center gap-6 sm:gap-8">

        {/* Icon */}
        <div className="
          w-24 h-24 sm:w-28 sm:h-28 rounded-3xl
          bg-white/10 dark:bg-white/5 backdrop-blur-sm
          border-2 border-white/20 dark:border-white/10
          flex items-center justify-center shadow-2xl
          text-5xl sm:text-6xl
        ">
          🎓
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-2 sm:gap-3 max-w-xs sm:max-w-sm">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {t.play.homeTitle.split(" ").slice(0, -1).join(" ")}<br />{t.play.homeTitle.split(" ").slice(-1)[0]}
          </h1>
          <p className="text-white/55 text-base sm:text-lg">
            {t.play.homeSubtitle}
          </p>
        </div>

        <form onSubmit={handleJoin} className="w-full max-w-xs sm:max-w-sm bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 flex flex-col gap-3">
          <TextField className="w-full">
            <Input
              suppressHydrationWarning
              placeholder={t.play.enterCode}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="text-center text-xl font-bold tracking-widest uppercase bg-white/5 border-white/10 hover:border-white/20 focus:border-violet-500 rounded-xl h-12 w-full outline-none transition-all text-white"
            />
          </TextField>
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            isDisabled={!accessCode.trim()}
          >
            {t.play.joinQuiz} <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        <div className="flex items-center gap-4 w-full max-w-xs sm:max-w-sm my-2">
          <div className="h-px bg-white/20 flex-1" />
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">OR</span>
          <div className="h-px bg-white/20 flex-1" />
        </div>

        {/* CTA button to Teacher Dashboard */}
        <Link href="/teacher/dashboard" className="w-full max-w-xs sm:max-w-sm">
          <button
            suppressHydrationWarning
            className="
              w-full py-4 sm:py-4.5 rounded-2xl
              bg-white/10 text-white font-bold text-lg sm:text-xl
              border border-white/20 hover:bg-white/20
              active:scale-97 transition-all duration-200
            "
          >
            {t.play.teacherPortal}
          </button>
        </Link>
      </div>
    </div>
  );
}
