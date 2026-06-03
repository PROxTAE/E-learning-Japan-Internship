"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Eye, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  SortAsc, 
  AlertCircle 
} from "lucide-react";
import { Input, Select, ListBox, ListBoxItem } from "@heroui/react";
import type { StudentResult, AnswerResult, QuestionStat } from "@/services/sessionHistoryApi";

interface ConfusionHeatmapProps {
  students?: StudentResult[];
  answers?: AnswerResult[];
  questionStats?: QuestionStat[];
}

export function ConfusionHeatmap({ students = [], answers = [], questionStats = [] }: ConfusionHeatmapProps) {
  const [filterMode, setFilterMode] = useState<"all" | "correct_wrong" | "confusion">("all");
  const [sortBy, setSortBy] = useState<"name" | "score_desc" | "score_asc" | "confusion">("score_desc");
  const [searchQuery, setSearchQuery] = useState("");

  if (!students || !questionStats || !students.length || !questionStats.length) return null;

  const sortedQuestions = [...questionStats].sort((a, b) => a.order - b.order);

  // 1. Search filter
  const searchedStudents = students.filter(s =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sort students
  const sortedStudents = [...searchedStudents].sort((a, b) => {
    if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "score_desc") {
      return (b.scorePercent ?? b.score) - (a.scorePercent ?? a.score);
    }
    if (sortBy === "score_asc") {
      return (a.scorePercent ?? a.score) - (b.scorePercent ?? b.score);
    }
    if (sortBy === "confusion") {
      const getConfusionScore = (sid: string) => {
        const studentAnswers = answers.filter(ans => ans.studentId === sid);
        return studentAnswers.reduce((acc, ans) => {
          if (ans.confusionLevel === "high") return acc + 2;
          if (ans.confusionLevel === "low") return acc + 1;
          return acc;
        }, 0);
      };
      return getConfusionScore(b.studentId) - getConfusionScore(a.studentId);
    }
    return 0;
  });

  // Dynamic Legend items based on View Mode
  const getLegendItems = () => {
    if (filterMode === "correct_wrong") {
      return [
        { color: "bg-emerald-500", label: "Correct (ถูกต้อง)" },
        { color: "bg-red-400",     label: "Wrong (ผิด)" },
        { color: "bg-default-200 dark:bg-white/10", label: "Unanswered (ไม่ได้ตอบ)" },
      ];
    }
    if (filterMode === "confusion") {
      return [
        { color: "bg-red-600",     label: "High Confusion (สับสนสูง)" },
        { color: "bg-amber-400",   label: "Hesitated (ลังเล)" },
        { color: "bg-default-100/30 dark:bg-white/5 opacity-50 border border-default-200/50", label: "No Confusion (ปกติ)" },
        { color: "bg-default-200 dark:bg-white/10", label: "Unanswered (ไม่ได้ตอบ)" },
      ];
    }
    return [
      { color: "bg-emerald-500", label: "Correct (ถูกต้อง)" },
      { color: "bg-red-400",     label: "Wrong (ผิด)" },
      { color: "bg-amber-400",   label: "Hesitated (ลังเล)" },
      { color: "bg-red-600",     label: "High Confusion (สับสนสูง)" },
      { color: "bg-default-200 dark:bg-white/10", label: "Unanswered (ไม่ได้ตอบ)" },
    ];
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400 pointer-events-none z-10">
            <Search className="w-4 h-4" />
          </div>
          <Input
            placeholder="ค้นหาชื่อนักเรียน..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9"
            size={"sm" as any}
          />
        </div>

        {/* View mode & sorting */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* View Mode selector */}
          <div className="relative flex items-center">
            <Eye className="absolute left-3 w-3.5 h-3.5 text-purple-500 pointer-events-none z-10" />
            <Select
              selectedKey={filterMode}
              onSelectionChange={(key) => setFilterMode(String(key) as any)}
              className="min-w-[195px]"
            >
              <Select.Trigger className="w-full pl-8 pr-8 py-2 rounded-xl text-xs bg-default-50 dark:bg-white/[0.02] border border-default-200 dark:border-white/10 text-foreground cursor-pointer text-left">
                <Select.Value />
                <Select.Indicator className="w-3.5 h-3.5 text-default-400" />
              </Select.Trigger>
              <Select.Popover className="z-50 min-w-[200px] mt-1 p-1 bg-white dark:bg-[#0f0f1a] border border-default-200 dark:border-white/10 rounded-xl shadow-lg">
                <ListBox className="focus:outline-none">
                  <ListBoxItem 
                    key="all" 
                    id="all" 
                    textValue="Show All (ทั้งหมด)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-purple-500" />
                      <span>Show All (ทั้งหมด)</span>
                    </div>
                  </ListBoxItem>
                  <ListBoxItem 
                    key="correct_wrong" 
                    id="correct_wrong" 
                    textValue="Correct/Wrong (ถูก/ผิด)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Correct/Wrong (ถูก/ผิด)</span>
                    </div>
                  </ListBoxItem>
                  <ListBoxItem 
                    key="confusion" 
                    id="confusion" 
                    textValue="Confusion Focus (จุดที่สับสน)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Confusion Focus (จุดที่สับสน)</span>
                    </div>
                  </ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-purple-500 pointer-events-none z-10" />
            <Select
              selectedKey={sortBy}
              onSelectionChange={(key) => setSortBy(String(key) as any)}
              className="min-w-[215px]"
            >
              <Select.Trigger className="w-full pl-8 pr-8 py-2 rounded-xl text-xs bg-default-50 dark:bg-white/[0.02] border border-default-200 dark:border-white/10 text-foreground cursor-pointer text-left">
                <Select.Value />
                <Select.Indicator className="w-3.5 h-3.5 text-default-400" />
              </Select.Trigger>
              <Select.Popover className="z-50 min-w-[220px] mt-1 p-1 bg-white dark:bg-[#0f0f1a] border border-default-200 dark:border-white/10 rounded-xl shadow-lg">
                <ListBox className="focus:outline-none">
                  <ListBoxItem 
                    key="score_desc" 
                    id="score_desc" 
                    textValue="Score: High to Low (คะแนนสูงสุด)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                      <span>Score: High to Low (คะแนนสูงสุด)</span>
                    </div>
                  </ListBoxItem>
                  <ListBoxItem 
                    key="score_asc" 
                    id="score_asc" 
                    textValue="Score: Low to High (คะแนนต่ำสุด)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      <span>Score: Low to High (คะแนนต่ำสุด)</span>
                    </div>
                  </ListBoxItem>
                  <ListBoxItem 
                    key="name" 
                    id="name" 
                    textValue="Name: A-Z (ชื่อ A-Z)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-3.5 h-3.5 text-blue-500" />
                      <span>Name: A-Z (ชื่อ A-Z)</span>
                    </div>
                  </ListBoxItem>
                  <ListBoxItem 
                    key="confusion" 
                    id="confusion" 
                    textValue="Most Confused (สับสนสูงสุด)"
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>Most Confused (สับสนสูงสุด)</span>
                    </div>
                  </ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex items-center gap-1 mb-1.5 pl-32">
            {sortedQuestions.map((q, i) => (
              <div key={q.questionId} className="w-8 text-center">
                <span className="text-[9px] font-bold text-default-400">Q{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Student rows */}
          {sortedStudents.length === 0 ? (
            <p className="text-xs text-default-400 py-4 pl-32">ไม่พบรายชื่อนักเรียน</p>
          ) : (
            sortedStudents.map((student, si) => {
              return (
                <motion.div
                  key={student.studentId}
                  className="flex items-center gap-1 mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(si * 0.03, 0.5) }}
                >
                  {/* Student name */}
                  <div className="w-32 shrink-0 pr-2">
                    <p className="text-xs font-semibold text-foreground/80 truncate">{student.name}</p>
                  </div>

                  {/* Answer cells */}
                  {sortedQuestions.map((q) => {
                    const ans = answers.find(a => a.studentId === student.studentId && a.questionId === q.questionId);
                    let color = "bg-default-200 dark:bg-white/10"; // unanswered
                    let title = "Unanswered (ไม่ได้ตอบ)";

                    if (ans) {
                      const isCorrect = ans.isCorrect;
                      const confusion = ans.confusionLevel || "none";

                      if (filterMode === "correct_wrong") {
                        if (isCorrect) {
                          color = "bg-emerald-500";
                          title = `Correct (${ans.responseTime}s)`;
                        } else {
                          color = "bg-red-400";
                          title = `Wrong: ${ans.choiceText || ans.choiceId} (${ans.responseTime}s)`;
                        }
                      } else if (filterMode === "confusion") {
                        if (confusion === "high") {
                          color = "bg-red-600";
                          title = `High Confusion — ${isCorrect ? "Correct" : "Wrong"} (${ans.responseTime}s)`;
                        } else if (confusion === "low") {
                          color = "bg-amber-400";
                          title = `Hesitated — ${isCorrect ? "Correct" : "Wrong"} (${ans.responseTime}s)`;
                        } else {
                          color = "bg-default-100/30 dark:bg-white/5 opacity-40 border border-default-200/50";
                          title = `${isCorrect ? "Correct" : "Wrong"} (No Confusion, ${ans.responseTime}s)`;
                        }
                      } else {
                        // "all" view
                        if (confusion === "high") {
                          color = "bg-red-600";
                          title = `High Confusion — ${isCorrect ? "Correct" : "Wrong"} (${ans.responseTime}s)`;
                        } else if (confusion === "low") {
                          color = "bg-amber-400";
                          title = `Hesitated — ${isCorrect ? "Correct" : "Wrong"} (${ans.responseTime}s)`;
                        } else if (isCorrect) {
                          color = "bg-emerald-500";
                          title = `Correct (${ans.responseTime}s)`;
                        } else {
                          color = "bg-red-400";
                          title = `Wrong: ${ans.choiceText || ans.choiceId} (${ans.responseTime}s)`;
                        }
                      }
                    }

                    return (
                      <div
                        key={q.questionId}
                        className="w-8 flex items-center justify-center"
                        title={title}
                      >
                        <div className={`w-6 h-6 rounded-md ${color} opacity-90 transition-all hover:scale-110 hover:opacity-100 cursor-default`} />
                      </div>
                    );
                  })}

                  {/* Score pill */}
                  <div className="ml-2">
                    <span className="text-[10px] font-bold text-default-500 tabular-nums">
                      {student.scorePercent ?? student.score}%
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Dynamic Legend */}
          <div className="flex items-center gap-4 mt-4 pl-32 flex-wrap">
            {getLegendItems().map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-[9px] text-default-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
