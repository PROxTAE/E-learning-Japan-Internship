"use client";

interface QuizProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

export function QuizProgress({ currentQuestionIndex, totalQuestions }: QuizProgressProps) {
  const value = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="w-full flex flex-col gap-3 mb-4 sm:mb-6">
      {/* Label row */}
      <div className="flex justify-between items-center">
        <span className="text-white/80 text-xs sm:text-sm font-semibold tracking-wide">
          Question{" "}
          <span className="text-white font-extrabold">
            {String(currentQuestionIndex + 1).padStart(2, "0")}
          </span>{" "}
          /{" "}
          {String(totalQuestions).padStart(2, "0")}
        </span>
        <span className="text-white/60 text-xs sm:text-sm font-medium">
          {Math.round(value)}% done
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500
            transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
