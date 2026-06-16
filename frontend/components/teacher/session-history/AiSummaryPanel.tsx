"use client";

import { useState, useRef } from "react";
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

interface AiSummaryPanelProps {
  label?: string;
  text?: string;
  setText?: React.Dispatch<React.SetStateAction<string>>;
  loading?: boolean;
  setLoading?: (v: boolean) => void;
  error?: string;
  setError?: (v: string) => void;
  onGenerate: (
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (msg: string) => void
  ) => () => void;
}

export function AiSummaryPanel({
  label,
  onGenerate,
  text: propText,
  setText: propSetText,
  loading: propLoading,
  setLoading: propSetLoading,
  error: propError,
  setError: propSetError,
}: AiSummaryPanelProps) {
  const { t } = useLang();

  // Local state fallbacks
  const [localText, localSetText]       = useState("");
  const [localLoading, localSetLoading] = useState(false);
  const [localError, localSetError]     = useState("");

  const text = propText !== undefined ? propText : localText;
  const setText = propSetText || localSetText;
  const loading = propLoading !== undefined ? propLoading : localLoading;
  const setLoading = propSetLoading || localSetLoading;
  const error = propError !== undefined ? propError : localError;
  const setError = propSetError || localSetError;

  const abortRef = useRef<(() => void) | null>(null);

  const handleGenerate = () => {
    if (abortRef.current) abortRef.current();
    setText("");
    setError("");
    setLoading(true);

    abortRef.current = onGenerate(
      (token) => setText(prev => prev + token),
      ()      => setLoading(false),
      (msg)   => { setError(msg); setLoading(false); }
    );
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <Button
          onPress={handleGenerate}
          isDisabled={loading}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all"
          size="sm"
        >
          {!loading && (
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 mr-1.5 shadow-sm shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/graduate_duck.svg" alt="AI" className="w-full h-full object-contain" />
            </span>
          )}
          {loading ? t.sessionHistory.aiLoading : (label || t.sessionHistory.generateAiSummary)}
        </Button>

        {text && !loading && (
          <Button
            onPress={handleGenerate}
            variant="ghost"
            size="sm"
            className="text-xs text-default-500"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{t.sessionHistory.aiError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streaming output */}
      <AnimatePresence>
        {(text || loading) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border border-violet-200/60 dark:border-violet-700/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-zinc-100 flex items-center justify-center p-1 mr-1.5 shadow-sm shrink-0 border border-zinc-200/50 dark:border-zinc-700/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/graduate_duck.svg" alt="AI" className="w-full h-full object-contain" />
                </span>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">AI Insights</span>
                {loading && (
                  <span className="inline-flex gap-1 ml-auto">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                )}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed font-mono">
                {text}
                {loading && <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 translate-y-0.5" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
