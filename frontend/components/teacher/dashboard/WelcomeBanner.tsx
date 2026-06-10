"use client";

import { motion } from "framer-motion";
import { Plus, Activity, BarChart2, Users } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTeacher } from "@/lib/auth";

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
  const teacher = getTeacher();

  // Defer date/greeting to client only — avoids SSR/CSR hydration mismatch
  const [greeting, setGreeting] = useState("");
  const [today, setToday]       = useState("");

  useEffect(() => {
    setGreeting(computeGreeting(lang));
    setToday(computeTodayString(lang));
  }, [lang]);

  const quickActions = [
    {
      icon: Plus,
      label: w.actions.createQuiz,
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/25",
      onClick: () => router.push("/teacher/create-quiz"),
    },
    {
      icon: Activity,
      label: w.actions.monitorLive,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/25",
      onClick: () => router.push("/teacher/monitoring"),
    },
    {
      icon: BarChart2,
      label: w.actions.viewReports,
      gradient: "from-blue-500 to-cyan-600",
      shadow: "shadow-blue-500/25",
      onClick: () => router.push("/teacher/reports"),
    },
    {
      icon: Users,
      label: w.actions.manageStudents,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25",
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
      data-ai-context-data={JSON.stringify({ section: "welcome", teacher: teacher?.name || "Mr. Takajo" })}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 lg:p-8 text-white shadow-2xl shadow-violet-500/30"
    >
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-purple-300/10 blur-xl" />
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
            <p suppressHydrationWarning className="text-white/60 text-sm font-medium min-h-[1.25rem]">
              {today}
            </p>
            <h1 suppressHydrationWarning className="text-2xl lg:text-3xl font-extrabold mt-1 leading-tight min-h-[2rem]">
              {greeting && (
                <>
                  {greeting},{" "}
                  <span className="text-yellow-300">{teacher?.name || "Mr. Takajo"}</span> 👋
                </>
              )}
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">
              {w.quote}
            </p>
          </div>

          {/* Floating stat pills */}
          <div className="flex gap-2 flex-wrap lg:flex-col lg:items-end shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {w.studentsOnline}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold"
            >
              <span className="text-yellow-300">🏆</span>
              {w.topScore}
            </motion.div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {quickActions.map((action, idx) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.07 }}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${action.gradient} shadow-lg ${action.shadow} text-white text-sm font-semibold hover:scale-105 hover:shadow-xl transition-all duration-200`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
