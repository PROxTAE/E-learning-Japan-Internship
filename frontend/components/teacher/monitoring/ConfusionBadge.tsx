"use client";

import { Chip } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";

interface ConfusionBadgeProps {
  level: "none" | "low" | "high";
}

export function ConfusionBadge({ level }: ConfusionBadgeProps) {
  const { t } = useLang();
  if (level === "none") return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Chip
        size="sm"
        variant="flat"
        color={level === "high" ? "danger" : "warning"}
        className="text-[10px] h-5"
      >
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {level === "high" ? t.monitoring.confusion.high : t.monitoring.confusion.hesitation}
        </div>
      </Chip>
    </motion.div>
  );
}
