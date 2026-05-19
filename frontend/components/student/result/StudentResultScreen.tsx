"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { quizApi } from "@/services/quizApi";
import type { StudentResult } from "@/services/studentResultApi";
import { ResultScoreCard } from "./ResultScoreCard";
import { AnswerReviewList } from "./AnswerReviewList";
import { motion } from "framer-motion";

function SimpleConfetti() {
  const colors = ["#fce18a", "#ff726d", "#b48def", "#f4306d", "#00b8a9"];
  const isClient = typeof window !== "undefined";
  if (!isClient) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            y: -20, 
            x: Math.random() * window.innerWidth 
          }}
          animate={{ 
            opacity: 0, 
            y: window.innerHeight, 
            x: Math.random() * window.innerWidth + (Math.random() > 0.5 ? 100 : -100),
            rotate: Math.random() * 720
          }}
          transition={{ duration: 2.5 + Math.random() * 2, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: Math.random() > 0.5 ? 12 : 8,
            height: Math.random() > 0.5 ? 12 : 8,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px"
          }}
        />
      ))}
    </div>
  );
}

interface StudentResultScreenProps {
  quizId: string;
  studentId: string;
  studentName: string;
  selectedAnswers: Record<string, string>;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function StudentResultScreen({ quizId, studentId, studentName, selectedAnswers, onPlayAgain, onGoHome }: StudentResultScreenProps) {
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);


  useEffect(() => {
    let mounted = true;
    setLoading(true);

    quizApi.getQuiz(quizId)
      .then((fullQuiz) => {
        if (!mounted) return;
        
        let correctCount = 0;
        const reviews = fullQuiz.questions.map((q: any) => {
          const qId = q.id || q._id;
          const studentChoiceId = selectedAnswers[qId] || null;
          const studentChoice = q.choices.find((c: any) => (c.id || c._id) === studentChoiceId);
          const correctChoice = q.choices.find((c: any) => c.isCorrect);
          
          const isCorrect = studentChoiceId === (correctChoice?.id || correctChoice?._id);
          if (isCorrect) correctCount++;
          
          return {
            questionId: qId,
            questionText: q.text || q.title || "Question",
            selectedChoiceId: studentChoiceId,
            selectedChoiceText: studentChoice?.text || null,
            correctChoiceId: correctChoice?.id || correctChoice?._id || "",
            correctChoiceText: correctChoice?.text || "Unknown",
            isCorrect
          };
        });

        const total = fullQuiz.questions.length;
        const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        
        const calculatedResult = {
          score: correctCount,
          total,
          percentage,
          reviews
        };
        
        setResult(calculatedResult);
        
        if (percentage >= 50) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      })
      .catch((err) => console.error("Failed to load result:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [quizId, selectedAnswers]);

  if (loading || !result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner size="lg" className="text-white" />
        <p className="text-white/70 font-semibold">Calculating your results...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {showConfetti && <SimpleConfetti />}
      
      <ResultScoreCard 
        studentName={studentName}
        score={result.score}
        total={result.total}
        percentage={result.percentage}
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
      />

      <AnswerReviewList reviews={result.reviews} />
    </div>
  );
}
