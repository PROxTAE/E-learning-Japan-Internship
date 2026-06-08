"use client";

import { motion } from "framer-motion";
import { Plus, Activity, BarChart2, Users } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function computeTodayString(lang: "en" | "th" | "ja"): string {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const localeMap: Record<string, string> = { en: "en-US", th: "th-TH", ja: "ja-JP" };
  return now.toLocaleDateString(localeMap[lang] ?? "en-US", opts);
}

function computeGreeting(lang: "en" | "th" | "ja"): string {
  const hour = new Date().getHours();
  const greetMap: Record<string, [string, string, string]> = {
    en: ["Good morning", "Good afternoon", "Good evening"],
    th: ["สวัสดีตอนเช้า", "สวัสดีตอนบ่าย", "สวัสดีตอนเย็น"],
    ja: ["おはようございます", "こんにちは", "こんばんは"],
  };
  const arr = greetMap[lang] ?? greetMap.en;
  if (hour < 12) return arr[0];
  if (hour < 17) return arr[1];
  return arr[2];
}

export function WelcomeBanner() {
  const { t, lang } = useLang();
  const router = useRouter();
  const w = t.welcome;

  // Defer date/greeting to client only — avoids SSR/CSR hydration mismatch
  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    setGreeting(computeGreeting(lang));
    setToday(computeTodayString(lang));
  }, [lang]);

  const quickActions = [
    {
      icon: Plus,
      label: w.actions.createQuiz,
      bg: "bg-brand-primary text-white",
      onClick: () => router.push("/teacher/create-quiz"),
    },
    {
      icon: Activity,
      label: w.actions.monitorLive,
      bg: "bg-brand-secondary text-white",
      onClick: () => router.push("/teacher/monitoring"),
    },
    {
      icon: BarChart2,
      label: w.actions.viewReports,
      bg: "bg-[#BCA135] text-white",
      onClick: () => router.push("/teacher/reports"),
    },
    {
      icon: Users,
      label: w.actions.manageStudents,
      bg: "bg-bg-secondary text-text-main",
      onClick: () => router.push("/teacher/students"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      data-ai-context-type="dashboard"
      data-ai-context-name="Welcome Banner"
      data-ai-context-data={JSON.stringify({ section: "welcome", teacher: "Mr. Takajo" })}
      className="relative overflow-hidden rounded-[24px] retro-card bg-brand-primary p-6 lg:p-8 text-white shadow-2xl"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-32 rounded-full bg-white blur-2xl" />
      </div>

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10">
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            {/* suppressHydrationWarning because today/greeting are client-only */}
            <p suppressHydrationWarning className="text-white/80 text-sm font-bold min-h-[1.25rem] tracking-wide">
              {today}
            </p>
            <h1 suppressHydrationWarning className="text-2xl lg:text-3xl font-black mt-1 leading-tight min-h-[2rem] uppercase">
              {greeting && (
                <>
                  {greeting},{" "}
                  <span className="text-yellow-300">Mr. Takajo</span> 👋
                </>
              )}
            </h1>
            <p className="text-white/90 text-sm mt-2 max-w-md font-bold leading-relaxed">
              {w.quote}
            </p>
          </div>

          {/* Floating stat pills */}
          <div className="flex gap-2 flex-wrap lg:flex-col lg:items-end shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full px-4 py-1.5 text-sm font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {w.studentsOnline}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full px-4 py-1.5 text-sm font-bold"
            >
              <span className="text-yellow-300">🏆</span>
              {w.topScore}
            </motion.div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-6 flex gap-3 flex-wrap">
          {quickActions.map((action, idx) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.07 }}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] border-3 border-text-main text-sm font-black transition-all ${action.bg} shadow-[3px_3px_0px_var(--theme-text-main)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_var(--theme-text-main)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--theme-text-main)] cursor-pointer`}
            >
              <action.icon className="w-4 h-4 stroke-[3]" />
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
