"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AnswerChange, Question } from "@/types/teacher/monitoring.types";
import { useTheme } from "next-themes";

interface AnswerTimelineChartProps {
  history: AnswerChange[];
  question: Question;
}

export function AnswerTimelineChart({ history, question }: AnswerTimelineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Map answer IDs to labels for Y axis
  const data = history.map(h => {
    const choiceIndex = question.choices.findIndex(c => c.id === h.answer);
    return {
      time: h.timestamp,
      choiceLabel: choiceIndex >= 0 ? `Choice ${choiceIndex + 1}` : "None",
      choiceIndex: choiceIndex + 1
    };
  });

  return (
    <div className="h-[120px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} vertical={false} />
          <XAxis 
            dataKey="time" 
            type="number" 
            domain={['auto', 'auto']} 
            tick={{ fontSize: 10 }} 
            stroke={isDark ? "#666" : "#999"}
          />
          <YAxis 
            ticks={[1, 2, 3, 4]} 
            domain={[0, 5]} 
            tick={{ fontSize: 10 }} 
            stroke={isDark ? "#666" : "#999"}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: isDark ? "#1f1f2e" : "#fff", border: "none", fontSize: "10px", borderRadius: "8px" }}
            itemStyle={{ color: "#a855f7" }}
          />
          <Line 
            type="stepAfter" 
            dataKey="choiceIndex" 
            stroke="#a855f7" 
            strokeWidth={2} 
            dot={{ r: 3, fill: "#a855f7" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
