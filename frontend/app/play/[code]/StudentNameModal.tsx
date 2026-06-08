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
            <div className="w-full max-w-sm bg-bg-card rounded-[24px] retro-card shadow-2xl overflow-hidden">
              {/* Top brand flat bar */}
              <div className="h-2 bg-brand-primary border-b-3 border-text-main" />

              <div className="p-8 flex flex-col items-center gap-6 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-bg-secondary border-3 border-text-main flex items-center justify-center">
                  <User className="w-8 h-8 text-text-main" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-text-main">What's your name?</h2>
                  <p className="text-sm text-text-muted mt-1">
                    Your teacher will see your progress in <span className="font-black text-brand-primary">{quizTitle}</span>
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <Input
                    placeholder="Enter your name…"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                    className="w-full bg-bg-secondary text-text-main font-bold border-3 border-text-main rounded-[16px] overflow-hidden"
                    size={"lg" as any}
                  />
                  {error && (
                    <p className="text-xs text-red-500 text-left font-black">{error}</p>
                  )}
                </div>

                <Button
                  onPress={handleSubmit}
                  size="lg"
                  className="w-full h-14 rounded-full font-black text-lg bg-brand-primary text-white shadow-xl retro-btn"
                >
                  Join & Start Quiz
                  <ArrowRight className="w-5 h-5 ml-1 stroke-[3]" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
