"use client";

import { Question, Choice } from "@/types/teacher/monitoring.types";
import { Popover, PopoverTrigger, PopoverContent, ProgressBar } from "@heroui/react";


interface QuestionTooltipProps {
  question: Question;
  children: React.ReactNode;
}

export function QuestionTooltip({ question, children }: QuestionTooltipProps) {
  return (
    <Popover {...{ placement: "bottom", showArrow: true, offset: 10 } as any}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 bg-default-50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
              Q{question.number} • {question.type}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              question.difficulty === "easy" ? "border-green-500/30 text-green-400" :
              question.difficulty === "medium" ? "border-yellow-500/30 text-yellow-400" :
              "border-red-500/30 text-red-400"
            }`}>
              {question.difficulty}
            </span>
          </div>
          <h4 className="text-sm font-bold text-foreground leading-snug">{question.title}</h4>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-default-500 uppercase">Live Responses</p>
            {question.choices.map((choice: Choice) => {
              const total = question.choices.reduce((sum, c) => sum + c.answerCount, 0);
              const percentage = total > 0 ? Math.round((choice.answerCount / total) * 100) : 0;
              return (
                <div key={choice.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`truncate max-w-[200px] ${choice.isCorrect ? "text-green-400 font-semibold" : "text-default-600"}`}>
                      {choice.text} {choice.isCorrect && "✓"}
                    </span>
                    <span className="text-default-400">{choice.answerCount} ({percentage}%)</span>
                  </div>
                  <ProgressBar 
                    {...{ 
                      size: "sm", 
                      value: percentage, 
                      color: choice.isCorrect ? "success" : "default",
                      classNames: { track: "bg-default-100" }
                    } as any}
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
            <div>
              <p className="text-[10px] text-default-400">Correct Rate</p>
              <p className="text-sm font-bold text-foreground">{question.correctPercentage}%</p>
            </div>
            <div>
              <p className="text-[10px] text-default-400">Avg Time</p>
              <p className="text-sm font-bold text-foreground">{question.averageResponseTime.toFixed(1)}s</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
