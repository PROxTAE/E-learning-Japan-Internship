"use client";

import { useMonitoringStore } from "@/store/monitoringStore";
import { Card, Avatar } from "@heroui/react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

export function Leaderboard() {
  const { t } = useLang();
  const { students, answers, questions } = useMonitoringStore();

  const topStudents = [...students].sort((a, b) => b.score - a.score || b.progress - a.progress).slice(0, 5);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-foreground">
        <Trophy className="w-8 h-8 text-yellow-500" />
        Top 5 Leaderboard
      </h2>

      <div className="flex flex-col gap-4 w-full">
        {topStudents.map((student, index) => {
          const studentAnswers = answers.filter((a) => a.studentId === student.id);
          const enrichedAnswers = studentAnswers
            .map((ans) => {
              const question = questions.find((q) => q.id === ans.questionId);
              return {
                questionNumber: question ? question.number : undefined,
                questionTitle: question ? question.title : "Unknown Question",
                difficulty: question ? question.difficulty : undefined,
                status: ans.state,
                studentAnswerText: ans.finalAnswerText || "No answer",
                isCorrect: ans.isCorrect,
                responseTimeSeconds: ans.responseTime,
                confusionLevel: ans.confusionLevel,
                answerChangesCount: ans.history ? ans.history.length : 0,
              };
            })
            .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

          const aiContextData = {
            ...student,
            detailedAnswers: enrichedAnswers,
          };

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="p-4 bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/10 shadow-lg flex flex-row items-center gap-6"
                data-ai-context-type="student"
                data-ai-context-name={student.name}
                data-ai-context-data={JSON.stringify(aiContextData)}
            >
              <div className="text-4xl font-black w-12 text-center text-gray-400 dark:text-gray-600">
                {index + 1}
              </div>
              
              <Avatar src={student.avatar} className="w-16 h-16 text-large" />
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{student.name}</h3>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>Progress: {student.progress}%</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-3xl font-black text-violet-500">{student.score}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Score</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
        {topStudents.length === 0 && (
          <div className="text-center text-gray-500 py-10">No students joined yet.</div>
        )}
      </div>
    </div>
  );
}
