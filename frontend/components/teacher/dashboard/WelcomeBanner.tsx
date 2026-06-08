"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Activity, BarChart2, Users } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimeCatGirlCharacter } from "@/components/shared/ThemeCharacters";

function computeTodayString(lang: "en" | "th" | "ja"): string {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
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

/* Floating sticker badge matching the image aesthetic */
function CyberBadge({ children, color, delay = 0, x = 0, y = 0 }: {
  children: React.ReactNode;
  color: string;
  delay?: number;
  x?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: [y, y - 8, y], x: [x, x + 3, x - 3, x] }}
      transition={{
        opacity: { delay, duration: 0.3 },
        scale: { delay, duration: 0.4, type: "spring", stiffness: 300 },
        y: { delay, duration: 3 + delay, repeat: Infinity, ease: "easeInOut" },
        x: { delay: delay + 0.5, duration: 4 + delay, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`absolute flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_#000] select-none ${color}`}
    >
      {children}
    </motion.div>
  );
}

/* Cross sparkle deco */
function CrossDeco({ size = 14, color = "currentColor", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M7 1V13M1 7H13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function WelcomeBanner() {
  const { t, lang } = useLang();
  const router = useRouter();
  const w = t.welcome;

  const [greeting, setGreeting] = useState("");
  const [today, setToday]       = useState("");

  useEffect(() => {
    setGreeting(computeGreeting(lang));
    setToday(computeTodayString(lang));
  }, [lang]);

  const quickActions = [
    { icon: Plus,     label: w.actions.createQuiz,     bg: "bg-[#BAFF29] text-black", onClick: () => router.push("/teacher/create-quiz") },
    { icon: Activity, label: w.actions.monitorLive,    bg: "bg-[#00BCD4] text-black", onClick: () => router.push("/teacher/monitoring") },
    { icon: BarChart2,label: w.actions.viewReports,    bg: "bg-[#FF6EB4] text-black", onClick: () => router.push("/teacher/reports") },
    { icon: Users,    label: w.actions.manageStudents, bg: "bg-white text-black",      onClick: () => router.push("/teacher/students") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      data-ai-context-type="dashboard"
      data-ai-context-name="Welcome Banner"
      data-ai-context-data={JSON.stringify({ section: "welcome", teacher: "Mr. Takajo" })}
      className="relative overflow-hidden rounded-2xl border-3 border-[var(--theme-text-main)] dark:border-[var(--theme-primary)]
        shadow-[6px_6px_0px_var(--theme-text-main)] dark:shadow-[6px_6px_0px_var(--theme-primary)]
        bg-[var(--theme-primary)] dark:bg-[#0C1929] p-6 lg:p-8 text-black dark:text-white"
    >
      {/* Grid bg texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Cross sparkle decos */}
      <div className="absolute top-3 right-24 opacity-60 pointer-events-none">
        <motion.div animate={{ rotate: [0, 90, 0] }} transition={{ duration: 6, repeat: Infinity }}>
          <CrossDeco size={18} color="#BAFF29" />
        </motion.div>
      </div>
      <div className="absolute top-8 right-14 opacity-40 pointer-events-none">
        <motion.div animate={{ rotate: [0, -90, 0] }} transition={{ duration: 8, repeat: Infinity }}>
          <CrossDeco size={12} color="white" />
        </motion.div>
      </div>
      <div className="absolute bottom-6 left-[44%] opacity-40 pointer-events-none">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
          <CrossDeco size={16} color="#BAFF29" />
        </motion.div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: text + actions */}
        <div className="lg:col-span-7 xl:col-span-8">
          <p suppressHydrationWarning className="text-black/70 dark:text-white/60 text-xs font-bold min-h-[1.1rem] tracking-widest uppercase">
            {today}
          </p>
          <h1 suppressHydrationWarning className="text-2xl lg:text-3xl font-black mt-1 leading-tight min-h-[2rem] uppercase tracking-tight">
            {greeting && (
              <>
                {greeting},{" "}
                <span className="bg-[#BAFF29] text-black px-2 rounded-lg border-2 border-black inline-block leading-tight">
                  Mr. Takajo
                </span>{" "}
                <span>👋</span>
              </>
            )}
          </h1>
          <p className="text-black/80 dark:text-white/80 text-sm mt-2 max-w-md font-bold leading-relaxed">
            {w.quote}
          </p>

          {/* Quick action pill buttons */}
          <div className="mt-5 flex gap-2.5 flex-wrap">
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.07, type: "spring", stiffness: 300 }}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black text-xs font-black uppercase tracking-wider
                  ${action.bg}
                  shadow-[2px_2px_0px_#000]
                  hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000]
                  active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000]
                  transition-all duration-100 cursor-pointer`}
              >
                <action.icon className="w-3.5 h-3.5 stroke-[3]" />
                {action.label}
              </motion.button>
            ))}
          </div>

          {/* Live stat pills */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-2 bg-black/20 dark:bg-white/10 border border-black/30 dark:border-white/20 rounded-full px-3 py-1 text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-[#BAFF29] animate-pulse" />
              {w.studentsOnline}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              className="flex items-center gap-2 bg-black/20 dark:bg-white/10 border border-black/30 dark:border-white/20 rounded-full px-3 py-1 text-xs font-bold"
            >
              <span className="text-yellow-400">🏆</span>
              {w.topScore}
            </motion.div>
          </div>
        </div>

        {/* Right: Anime mascot character with floating sticker badges */}
        <div className="lg:col-span-5 xl:col-span-4 flex justify-center items-end relative h-[200px] lg:h-[220px]">
          {/* Floating sticker badges */}
          <CyberBadge color="bg-[#BAFF29]" delay={0.3} x={-80} y={20}>
            <span>⚡</span> NO.100%
          </CyberBadge>
          <CyberBadge color="bg-white" delay={0.5} x={60} y={15}>
            <span>🌊</span> {w.studentsOnline}
          </CyberBadge>
          <CyberBadge color="bg-[#FF6EB4]" delay={0.7} x={50} y={100}>
            <span>🏆</span> TOP.CLASS
          </CyberBadge>
          <CyberBadge color="bg-[#00BCD4]" delay={0.9} x={-90} y={110}>
            <span>✦</span> LIVE
          </CyberBadge>

          {/* Mascot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <AnimeCatGirlCharacter size={180} animate={true} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
