"use client";

import { useMonitoringStore } from "@/store/monitoringStore";
import { Card, ProgressBar } from "@heroui/react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export function VisualAnalytics() {
  const { questions, answers, students } = useMonitoringStore();

  const totalStudents = students.length;

  return (
    <div
      className="flex flex-col w-full max-w-6xl mx-auto py-8"
      data-ai-context-type="analytics"
      data-ai-context-name="Visual Analytics"
      data-ai-context-data={JSON.stringify({ questionCount: questions.length, totalStudents, totalAnswers: answers.length })}
    >
      <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-foreground">
        <BarChart3 className="w-7 h-7 text-blue-500" />
        Question Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {questions.map((q, index) => {
          const qAnswers = answers.filter(a => a.questionId === q.id && a.finalAnswer);
          const totalAnswers = qAnswers.length;
          
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-lg">Q{q.number}: {q.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {totalAnswers} / {totalStudents} Responses
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  {q.choices.map((choice) => {
                    const count = qAnswers.filter(a => a.finalAnswer === choice.id).length;
                    const percent = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                    
                    return (
                      <div key={choice.id} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className={choice.isCorrect ? "font-bold text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}>
                            {choice.text} {choice.isCorrect && "✓"}
                          </span>
                          <span className="font-bold">{percent}% ({count})</span>
                        </div>
                        <ProgressBar 
                          value={percent} 
                          color={choice.isCorrect ? "success" : "default"} 
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
