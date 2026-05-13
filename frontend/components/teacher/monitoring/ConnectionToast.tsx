"use client";

/**
 * ConnectionToast — floating notification for student join/leave events.
 * Shows a brief animated banner at the bottom-right corner.
 *
 * Usage:
 *   const { notify } = useConnectionToast();
 *   notify({ type: "join",  studentName: "Alice" });
 *   notify({ type: "leave", studentName: "Bob"   });
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, UserX } from "lucide-react";

interface ToastItem {
  id:          number;
  type:        "join" | "leave";
  studentName: string;
}

const DURATION_MS = 3500;

export function useConnectionToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const notify = useCallback(({ type, studentName }: { type: "join" | "leave"; studentName: string }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-4), { id, type, studentName }]); // max 5 at once

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  const ToastContainer = (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{    opacity: 0, x: 80, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl
              min-w-[220px] max-w-[300px]
              ${toast.type === "join"
                ? "bg-emerald-500/90 border-emerald-400/50 text-white"
                : "bg-gray-700/90 dark:bg-zinc-800/95 border-gray-500/30 text-gray-200"
              }
            `}
          >
            {/* Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shrink-0
              ${toast.type === "join"
                ? "bg-white/20"
                : "bg-white/10"
              }
            `}>
              {toast.type === "join"
                ? <UserCheck className="w-4 h-4" />
                : <UserX     className="w-4 h-4" />
              }
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wider opacity-75">
                {toast.type === "join" ? "Student Joined" : "Student Left"}
              </p>
              <p className="text-sm font-bold truncate">{toast.studentName}</p>
            </div>

            {/* Progress bar (auto-dismiss timer) */}
            <motion.div
              className={`
                absolute bottom-0 left-0 h-[3px] rounded-b-2xl
                ${toast.type === "join" ? "bg-white/40" : "bg-white/20"}
              `}
              initial={{ width: "100%" }}
              animate={{ width: "0%"   }}
              transition={{ duration: DURATION_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { notify, ToastContainer };
}
