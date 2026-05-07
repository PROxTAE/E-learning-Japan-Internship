"use client";

import { LiveStats } from "@/types/teacher/monitoring.types";
import { Card } from "@heroui/react";
import { Users, CheckCircle, Flame, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface LiveStatsPanelProps {
  stats: LiveStats;
}

export function LiveStatsPanel({ stats }: LiveStatsPanelProps) {
  const statItems = [
    {
      title: "Active Students",
      value: `${stats.activeStudents}/${stats.totalStudents}`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      title: "Avg Score",
      value: `${stats.averageScore.toFixed(1)}%`,
      icon: BarChart3,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      title: "Completion",
      value: `${stats.completionPercentage}%`,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/20",
    },
    {
      title: "Live Status",
      value: "Monitoring",
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
      isPulsing: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, idx) => (
        <Card key={idx} className="bg-default-50 border border-white/5 backdrop-blur-md shadow-sm">
          <div className="flex flex-row items-center gap-4 p-4">
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`w-6 h-6 ${item.color} ${item.isPulsing ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase tracking-wider font-semibold">{item.title}</p>
              <motion.p
                key={item.value}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-foreground"
              >
                {item.value}
              </motion.p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
