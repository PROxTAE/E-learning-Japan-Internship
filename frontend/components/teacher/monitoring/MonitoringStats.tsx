"use client";

import { Card, Tooltip } from "@heroui/react";
import { Users, Target, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LiveStats } from "@/types/teacher/monitoring.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface MonitoringStatsProps {
  stats: LiveStats;
}

export function MonitoringStats({ stats }: MonitoringStatsProps) {
  const { t } = useLang();
  
  const items = [
    { label: t.monitoring.stats.active, value: `${stats.activeStudents}/${stats.totalStudents}`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t.monitoring.stats.score, value: `${stats.averageScore}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: t.monitoring.stats.completion, value: `${stats.completionPercentage}%`, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { 
      label: t.monitoring.stats.efficiency, 
      value: `${stats.efficiencyScore ?? 0}%`, 
      icon: Zap, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10",
      tooltip: t.monitoring.stats.efficiencyTooltip
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      data-ai-context-type="stats"
      data-ai-context-name="Monitoring Stats"
      data-ai-context-data={JSON.stringify(stats)}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {item.tooltip ? (
            // @ts-expect-error HeroUI Tooltip types issue
            <Tooltip content={item.tooltip} placement="top" delay={300} showArrow>
              <div className="cursor-help">
                <Card className="p-4 bg-white dark:bg-gray-500/10 border border-gray-400/10 dark:border-gray-200/10 backdrop-blur-md shadow-none hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-xl font-black text-foreground">{item.value}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Tooltip>
          ) : (
            <Card className="p-4 bg-white dark:bg-gray-500/10 border border-gray-400/10 dark:border-gray-200/10 backdrop-blur-md shadow-none hover:border-white/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-xl font-black text-foreground">{item.value}</p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      ))}
    </div>
  );
}
