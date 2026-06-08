"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import {
  AnimeCatGirlCharacter,
  AnimeShibaCharacter,
  AnimeRobotCharacter,
  AnimeGhostCharacter,
} from "@/components/shared/ThemeCharacters";

interface TipItem {
  id: number;
  text: string;
  characterType: "catgirl" | "shiba" | "robot" | "ghost";
  label: string;
  accent: string;
}

export function TeacherTipsCard() {
  const { lang } = useLang();
  const [currentIdx, setCurrentIdx] = useState(0);

  const tipsMap: Record<string, TipItem[]> = {
    en: [
      { id: 1, text: "Setting access codes prevents unauthorized students from joining your live quiz session!", characterType: "catgirl", label: "HANA says:", accent: "bg-[var(--theme-primary)] text-black" },
      { id: 2, text: "Multiple-choice questions show live response bars on the teacher's screen during play!", characterType: "robot",   label: "BYTE says:", accent: "bg-[var(--theme-secondary)] text-black" },
      { id: 3, text: "Adding cute emojis to quizzes helps students identify subjects and chapters instantly!", characterType: "shiba",   label: "KIRA says:", accent: "bg-[#FF6EB4] text-black" },
      { id: 4, text: "You can always view and download completed quiz analytics inside the Reports tab.",    characterType: "ghost",   label: "CHI says:",  accent: "bg-[var(--theme-accent)] text-white" },
    ],
    th: [
      { id: 1, text: "การตั้งรหัสผ่าน (Access Code) ช่วยป้องกันผู้ร่วมเล่นที่ไม่ได้รับอนุญาตในห้องเรียนสด!", characterType: "catgirl", label: "ฮานะ บอกว่า:", accent: "bg-[var(--theme-primary)] text-black" },
      { id: 2, text: "คำถามประเภทปรนัยจะแสดงแถบวิเคราะห์คำตอบแบบเรียลไทม์บนจอของครูในขณะเปิดเซสชัน!",   characterType: "robot",   label: "ไบต์ บอกว่า:", accent: "bg-[var(--theme-secondary)] text-black" },
      { id: 3, text: "การเลือกใช้อิโมจิน่ารักๆ ช่วยให้เด็กๆ จดจำวิชาและหมวดหมู่บทเรียนได้ง่ายขึ้นเป็นกองเลย!", characterType: "shiba", label: "คิระ บอกว่า:", accent: "bg-[#FF6EB4] text-black" },
      { id: 4, text: "คุณสามารถย้อนกลับมาดูและดาวน์โหลดสถิติการเล่นของเซสชันย้อนหลังได้ตลอดเวลาในเมนูรายงาน", characterType: "ghost", label: "ชิ บอกว่า:", accent: "bg-[var(--theme-accent)] text-white" },
    ],
    ja: [
      { id: 1, text: "アクセスコードを設定すると、ライブクイズへの部外者の参加を簡単に防ぐことができます！", characterType: "catgirl", label: "ハナ より:", accent: "bg-[var(--theme-primary)] text-black" },
      { id: 2, text: "選択肢問題では、リアルタイムで生徒の回答状況が先生の画面に表示されます！",               characterType: "robot",   label: "バイト より:", accent: "bg-[var(--theme-secondary)] text-black" },
      { id: 3, text: "クイズに可愛い絵文字を登録しておくと、生徒が科目や単元を見つけやすくなります！",       characterType: "shiba",   label: "キラ より:", accent: "bg-[#FF6EB4] text-black" },
      { id: 4, text: "終了したセッションの統計と分析レポートは、いつでもレポートタブからエクスポートできます。", characterType: "ghost", label: "チイ より:", accent: "bg-[var(--theme-accent)] text-white" },
    ],
  };

  const tips = tipsMap[lang] ?? tipsMap.en;
  const currentTip = tips[currentIdx] ?? tips[0];

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % tips.length);

  useEffect(() => {
    const timer = setInterval(handleNext, 12000);
    return () => clearInterval(timer);
  }, [tips.length]);

  const renderCharacter = (type: string) => {
    switch (type) {
      case "catgirl": return <AnimeCatGirlCharacter size={90} />;
      case "shiba":   return <AnimeShibaCharacter   size={90} />;
      case "robot":   return <AnimeRobotCharacter   size={90} />;
      case "ghost":   return <AnimeGhostCharacter   size={90} />;
      default:        return <AnimeCatGirlCharacter size={90} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border-2 border-[var(--theme-border)] dark:border-[var(--theme-primary)]/40
        bg-[var(--theme-card-bg)] dark:bg-[var(--theme-card-bg)]
        p-4 flex flex-col gap-3 overflow-hidden relative"
    >
      {/* Grid bg subtle texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(var(--theme-primary) 1px, transparent 1px), linear-gradient(90deg, var(--theme-primary) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Label */}
      <div className="relative z-10 flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentTip.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-black/30 ${currentTip.accent}`}
          >
            {currentTip.label}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] text-[var(--theme-text-muted)] font-semibold ml-auto">
          {currentIdx + 1} / {tips.length}
        </span>
      </div>

      {/* Character + speech bubble */}
      <div className="relative z-10 flex items-end gap-3">
        {/* Mascot character */}
        <div className="shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip.characterType}
              initial={{ scale: 0.6, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.6, opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {renderCharacter(currentTip.characterType)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Speech bubble */}
        <div className="relative flex-1 bg-[var(--theme-bg-secondary)] dark:bg-[var(--theme-bg-secondary)]
          border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-primary)]/60
          rounded-2xl rounded-bl-sm p-3
          shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-primary)]">
          {/* Bubble tail */}
          <div className="absolute -left-2 bottom-3 w-3 h-3
            bg-[var(--theme-bg-secondary)] border-l-2 border-b-2
            border-[var(--theme-text-main)] dark:border-[var(--theme-primary)]/60
            rotate-45" />
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip.text}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-xs leading-relaxed font-semibold text-[var(--theme-text-main)]"
            >
              {currentTip.text}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Next button */}
      <div className="relative z-10 flex justify-end">
        <button
          onClick={handleNext}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest
            text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]
            border border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]
            px-3 py-1 rounded-full transition-all cursor-pointer"
        >
          Next <ChevronRight className="w-3 h-3 stroke-[3]" />
        </button>
      </div>
    </motion.div>
  );
}
