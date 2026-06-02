"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@heroui/react";
import { User, ArrowRight } from "lucide-react";

interface StudentNameModalProps {
  quizTitle: string;
  isOpen: boolean;
  onConfirm: (name: string, studentId: string) => void;
}

export function StudentNameModal({ quizTitle, isOpen, onConfirm }: StudentNameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    // Generate a simple studentId from name + timestamp
    const studentId = `${trimmed.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString(36)}`;
    onConfirm(trimmed, studentId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />

              <div className="p-8 flex flex-col items-center gap-6 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-violet-500" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-zinc-800 dark:text-white">What's your name?</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Your teacher will see your progress in <span className="font-semibold text-violet-500">{quizTitle}</span>
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <Input
                    placeholder="Enter your name…"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                    className="w-full"
                    size={"lg" as any}
                  />
                  {error && (
                    <p className="text-xs text-red-500 text-left font-medium">{error}</p>
                  )}
                </div>

                <Button
                  onPress={handleSubmit}
                  size="lg"
                  className="w-full h-14 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl"
                >
                  Join & Start Quiz
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
