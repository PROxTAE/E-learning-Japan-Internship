"use client";

import { Card } from "@heroui/react";
import { Users, Target, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LiveStats } from "@/types/teacher/monitoring.types";

interface MonitoringStatsProps {
  stats: LiveStats;
}

export function MonitoringStats({ stats }: MonitoringStatsProps) {
  const items = [
    { label: "Online", value: `${stats.activeStudents}/${stats.totalStudents}`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Avg Score", value: `${stats.averageScore}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Completion", value: `${stats.completionPercentage}%`, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Efficiency", value: "84%", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="p-4 bg-white dark:bg-gray-500/10  border border-gray-400/10 dark:border-gray-200/10 backdrop-blur-md shadow-none hover:border-white/20 transition-colors">
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
        </motion.div>
      ))}
    </div>
  );
}
