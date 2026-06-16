"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, ScrollShadow, Skeleton, Card } from "@heroui/react";
import { Sparkles, Send, X, Bot, Trash2, ArrowUpRight, MessageSquareCode, Maximize2, Minimize2, Target, Square, Clock, HelpCircle, ChevronDown, ChevronUp, Info, BookOpen, Layers, Award, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useContextSelector, type AIContext } from "@/hooks/useContextSelector";
import { useQuizStore } from "@/store/quizStore";
import { useRouter, usePathname } from "next/navigation";
import { jsonrepair } from "jsonrepair";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code block content", err);
    }
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-950 text-zinc-100 font-mono text-xs">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800/50 text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider select-none">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-white transition-colors flex items-center gap-1 text-[10px] font-sans cursor-pointer"
        >
          {copied ? (
            <span className="text-emerald-400 font-medium">Copied!</span>
          ) : (
            <span>Copy</span>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const localTranslations = {
  en: {
    welcome: "Hello! I am your AI Assistant. How can I help you today? Feel free to ask anything!",
    welcomeCleared: "Chat cleared. Is there anything else I can help you with?",
    headerTitle: "AI Assistant",
    subtitle: (model: string) => model ? `Powered by Ollama (${model})` : "Local Ollama Connected",
    suggestedTitle: "Suggested Prompts",
    inputPlaceholder: "Type a message to AI...",
    clearLabel: "Clear conversation",
    maximizeLabel: "Maximize chat",
    minimizeLabel: "Minimize chat",
    errTitle: "⚠️ Cannot connect to Ollama",
    errGuide1: "1. Start Ollama on your machine.",
    errGuide2: "2. Run a model in Terminal: ",
    errConnect: "Could not connect to Ollama. Please check if Ollama is running (`ollama serve`) and has a model installed.",
    suggestions: [
      "Create a quiz about Web Application basics",
      "Explain the difference between GET and POST",
      "Give examples of React Hooks",
    ]
  },
  th: {
    welcome: "สวัสดีครับ! ผมคือ AI Assistant ของคุณ วันนี้อยากให้ผมช่วยแนะนำ หรือสร้าง Quiz ในหัวข้ออะไรดีครับ? สามารถถามได้เลย!",
    welcomeCleared: "เคลียร์การสนทนาแล้วครับ มีคำถามอื่นเพิ่มเติมไหมครับ?",
    headerTitle: "ผู้ช่วย AI",
    subtitle: (model: string) => model ? `ใช้งานผ่าน Ollama (${model})` : "เชื่อมต่อ Ollama สำเร็จ",
    suggestedTitle: "แนะนำคำถาม",
    inputPlaceholder: "พิมพ์ข้อความคุยกับ AI...",
    clearLabel: "เคลียร์การสนทนา",
    maximizeLabel: "ขยายหน้าจอ",
    minimizeLabel: "ย่อหน้าจอ",
    errTitle: "⚠️ ไม่สามารถติดต่อ Ollama ได้",
    errGuide1: "1. รันโปรแกรม Ollama บนเครื่องของคุณ",
    errGuide2: "2. พิมพ์คำสั่งรันโมเดลใน Terminal เช่น: ",
    errConnect: "ไม่สามารถเชื่อมต่อกับ Ollama ได้ โปรดตรวจสอบว่ารัน Ollama อยู่หรือไม่ (`ollama serve`) และติดตั้งโมเดลแล้ว",
    suggestions: [
      "อยากสร้าง Quiz เกี่ยวกับ พื้นฐาน Web Application",
      "ช่วยอธิบายความแตกต่างระหว่าง GET กับ POST",
      "ขอตัวอย่างข้อสอบเกี่ยวกับ React Hooks",
    ]
  },
  ja: {
    welcome: "こんにちは！私はあなたのAIアシスタントです。本日はどのようなお手伝いをしましょうか？お気軽にご質問ください！",
    welcomeCleared: "会話をクリアしました。他にお手伝いできることはありますか？",
    headerTitle: "AIアシスタント",
    subtitle: (model: string) => model ? `Ollamaで動作中 (${model})` : "ローカルOllamaに接続中",
    suggestedTitle: "おすすめの質問",
    inputPlaceholder: "AIにメッセージを入力...",
    clearLabel: "会話をクリア",
    maximizeLabel: "最大化",
    minimizeLabel: "最小化",
    errTitle: "⚠️ Ollamaに接続できません",
    errGuide1: "1. ローカルマシンでOllamaを起動してください。",
    errGuide2: "2. ターミナルでモデルを実行します: ",
    errConnect: "Ollamaに接続できません。Ollamaが起動しているか（`ollama serve`）、モデルがインストールされているか確認してください。",
    suggestions: [
      "Webアプリケーションの基本についてのクイズを作成",
      "GETとPOSTの違いを説明してください",
      "React Hooksのコード例を教えてください",
    ]
  }
};

// Strip code fences / comments and isolate the outermost JSON object so that
// jsonrepair gets clean input. We intentionally do NOT convert single quotes
// here — that corrupts apostrophes inside text (e.g. "Hunter x Hunter's").
// jsonrepair handles single-quoted keys/values safely on its own.
function cleanJsonString(str: string): string {
  let s = str
    .replace(/^\s*```(?:json|json_quiz_update)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Keep only from the first opening brace onward (drops stray prose prefixes).
  const firstBrace = s.indexOf("{");
  if (firstBrace > 0) s = s.slice(firstBrace);
  return s;
}

// Robustly parse possibly-malformed JSON emitted by the local LLM.
// jsonrepair fixes unescaped quotes/newlines, single quotes, trailing commas,
// and truncated/unclosed objects — the cases the old regex pipeline missed.
function parseQuizJson(raw: string): any {
  const cleaned = cleanJsonString(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    // jsonrepair throws if it cannot recover — let the caller handle it.
    return JSON.parse(jsonrepair(cleaned));
  }
}

interface QuizUpdateSummaryProps {
  codeString: string;
  lang: string;
  isGenerating?: boolean;
}

const summaryTranslations = {
  en: {
    updating: "Analyzing and applying quiz updates...",
    updated: "Quiz updated successfully!",
    title: "Quiz Title",
    description: "Description",
    category: "Category",
    difficulty: "Difficulty",
    duration: "Duration",
    minutes: "mins",
    noLimit: "No time limit",
    questions: "Questions",
    questionCount: (count: number) => `${count} question${count !== 1 ? "s" : ""}`,
    showQuestions: "Show questions detail",
    hideQuestions: "Hide questions detail",
    correct: "Correct",
    type: "Type",
    multiple_choice: "Multiple Choice",
    true_false: "True/False",
    short_answer: "Short Answer",
    chapter: "Chapter",
    subject: "Subject",
    confirmBtn: "Confirm & Create Quiz",
    confirmBtnSuccess: "Applied to Quiz Builder!",
    confirmBtnNavigate: "Apply & Go to Builder",
  },
  th: {
    updating: "กำลังวิเคราะห์และอัปเดตแบบทดสอบ...",
    updated: "ปรับปรุงข้อสอบเรียบร้อยแล้ว!",
    title: "ชื่อแบบทดสอบ",
    description: "คำอธิบาย",
    category: "หมวดหมู่",
    difficulty: "ระดับความยาก",
    duration: "เวลาที่ใช้",
    minutes: "นาที",
    noLimit: "ไม่จำกัดเวลา",
    questions: "ข้อสอบ",
    questionCount: (count: number) => `${count} ข้อ`,
    showQuestions: "แสดงรายละเอียดข้อสอบ",
    hideQuestions: "ซ่อนรายละเอียดข้อสอบ",
    correct: "ถูกต้อง",
    type: "ประเภท",
    multiple_choice: "ปรนัย (หลายตัวเลือก)",
    true_false: "ถูก/ผิด",
    short_answer: "อัตนัย (เติมคำ)",
    chapter: "บทเรียน",
    subject: "วิชา",
    confirmBtn: "ยืนยันสร้างข้อสอบ",
    confirmBtnSuccess: "นำไปใช้ในหน้าสร้างข้อสอบแล้ว!",
    confirmBtnNavigate: "นำข้อมูลไปใช้ในหน้าสร้างข้อสอบ",
  },
  ja: {
    updating: "クイズの更新を分析して適用しています...",
    updated: "クイズが正常に更新されました！",
    title: "クイズのタイトル",
    description: "説明",
    category: "カテゴリ",
    difficulty: "難易度",
    duration: "制限時間",
    minutes: "分",
    noLimit: "時間制限なし",
    questions: "問題",
    questionCount: (count: number) => `${count} 問`,
    showQuestions: "問題の詳細を表示",
    hideQuestions: "問題の詳細を非表示",
    correct: "正解",
    type: "タイプ",
    multiple_choice: "選択式",
    true_false: "○×問題",
    short_answer: "記述式",
    chapter: "章",
    subject: "科目",
    confirmBtn: "クイズ作成を確認",
    confirmBtnSuccess: "クイズビルダーに適用されました！",
    confirmBtnNavigate: "適用してビルダーに移動",
  }
};

function QuizUpdateSummary({ codeString, lang, isGenerating }: QuizUpdateSummaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const t = summaryTranslations[lang as "en" | "th" | "ja"] || summaryTranslations.en;

  let quizData: any = null;
  let parseError = false;

  try {
    quizData = parseQuizJson(codeString);
  } catch (e) {
    parseError = true;
  }

  if (parseError || !quizData || typeof quizData !== "object") {
    return (
      <div className="my-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3 font-medium shadow-sm">
        <span className="relative flex h-3.5 w-3.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[13px]">{t.updating}</span>
        </div>
      </div>
    );
  }

  const title = quizData.title || "";
  const description = quizData.description || "";
  const category = quizData.category || "";
  const difficulty = quizData.difficulty || "";
  const durationMinutes = quizData.durationMinutes;
  const subject = quizData.subject || "";
  const chapter = quizData.chapter || "";
  const questions = Array.isArray(quizData.questions) ? quizData.questions : [];

  const handleApply = () => {
    try {
      useQuizStore.getState().updateQuizFromAi(quizData);
      setIsApplied(true);
      if (pathname !== "/teacher/create-quiz") {
        router.push("/teacher/create-quiz?from_ai=true");
      }
    } catch (err) {
      console.error("Failed to apply quiz update:", err);
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/20 bg-white dark:bg-zinc-900/90 shadow-md shadow-emerald-500/5 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border-b border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-[13px] text-emerald-800 dark:text-emerald-300">
              {t.updated}
            </h4>
            {title && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[220px]">
                {title}
              </p>
            )}
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
          {t.questionCount(questions.length)}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {subject && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/45 border border-zinc-100 dark:border-zinc-800/40">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{t.subject}</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{subject}</p>
              </div>
            </div>
          )}
          {chapter && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/45 border border-zinc-100 dark:border-zinc-800/40">
              <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{t.chapter}</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{chapter}</p>
              </div>
            </div>
          )}
        </div>

        {description && (
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/50 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            <span className="font-bold text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">{t.description}</span>
            {description}
          </div>
        )}

        {questions.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-colors py-1 cursor-pointer bg-transparent border-none"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                {isExpanded ? t.hideQuestions : t.showQuestions}
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin"
                >
                  {questions.map((q: any, qIdx: number) => (
                    <div
                      key={q.id || qIdx}
                      className="p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex-1">
                          {qIdx + 1}. {q.text}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                          {t[q.type as keyof typeof t] || q.type}
                        </span>
                      </div>

                      {Array.isArray(q.choices) && q.choices.length > 0 && (
                        <div className="grid grid-cols-1 gap-1 pl-2">
                          {q.choices.map((c: any, cIdx: number) => (
                            <div
                              key={c.id || cIdx}
                              className={`
                                flex items-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium
                                ${c.isCorrect
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10"
                                  : "text-zinc-500 dark:text-zinc-400"
                                }
                              `}
                            >
                              <span className={`
                                w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold
                                ${c.isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }
                              `}>
                                {String.fromCharCode(65 + cIdx)}
                              </span>
                              <span className="truncate flex-1">{c.text}</span>
                              {c.isCorrect && (
                                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-bold uppercase scale-90">
                                  {t.correct}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!isGenerating && (
        <div className="px-4 pb-4 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-3 flex justify-end">
          <button
            type="button"
            disabled={isApplied}
            onClick={handleApply}
            className={`
              w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
              ${isApplied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 cursor-default"
                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:shadow-emerald-600/10 cursor-pointer active:scale-[0.98]"
              }
            `}
          >
            {isApplied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span>{t.confirmBtnSuccess}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{pathname === "/teacher/create-quiz" ? t.confirmBtn : t.confirmBtnNavigate}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const pathname = usePathname();
  const { lang } = useLang();

  // Hide on projector presentation views and student play screens
  if (pathname?.startsWith("/present") || pathname?.startsWith("/play")) {
    return null;
  }

  const localT = localTranslations[lang] || localTranslations.en;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedContexts, setSelectedContexts] = useState<AIContext[]>([]);
  const [isSelectingContext, setIsSelectingContext] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaUrl, setOllamaUrl] = useState<string>("");

  const checkConnection = async () => {
    setConnectionStatus("checking");
    setOllamaError(null);
    try {
      const res = await fetch("/api/ai-status");
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setConnectionStatus("connected");
          setActiveModel(data.model);
          setAvailableModels(data.models || []);
          setOllamaUrl(data.url);
        } else {
          setConnectionStatus("disconnected");
          setOllamaError(data.error || "Ollama server not responding");
          setOllamaUrl(data.url);
        }
      } else {
        setConnectionStatus("disconnected");
        setOllamaError(`HTTP error ${res.status}`);
      }
    } catch (err: any) {
      setConnectionStatus("disconnected");
      setOllamaError(err.message || "Failed to reach AI status endpoint");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  useContextSelector(isSelectingContext, (context) => {
    setSelectedContexts((prev) => {
      const exists = prev.some(c => c.name === context.name && c.type === context.type);
      if (exists) return prev;
      return [...prev, context];
    });
    setIsSelectingContext(false);
  });

  const handleSelectEntirePage = () => {
    try {
      const elements = document.querySelectorAll("[data-ai-context-type]");
      const pageData: any[] = [];
      elements.forEach((el) => {
        const type = el.getAttribute("data-ai-context-type") || "general";
        const name = el.getAttribute("data-ai-context-name") || "Component";
        const rawData = el.getAttribute("data-ai-context-data");

        let data = null;
        if (rawData) {
          try {
            data = JSON.parse(rawData);
          } catch (err) {
            data = rawData;
          }
        }
        pageData.push({ type, name, data });
      });

      const entirePageContext: AIContext = {
        type: "page",
        name: lang === "th" ? "ทั้งหน้าเว็บ" : lang === "ja" ? "画面全体" : "Entire Page",
        data: {
          url: window.location.href,
          title: document.title,
          components: pageData
        }
      };

      setSelectedContexts((prev) => {
        const exists = prev.some(c => c.type === "page");
        if (exists) {
          return prev.map(c => c.type === "page" ? entirePageContext : c);
        }
        return [...prev, entirePageContext];
      });
      setIsSelectingContext(false);
    } catch (err) {
      console.error("Failed to select entire page context:", err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSuggestionClick = (suggestionText: string) => {
    setInput(suggestionText);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-cleared",
        role: "assistant",
        content: "",
      },
    ]);
    setSelectedContexts([]);
    setErrorMsg(null);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput("");
    setErrorMsg(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome" && m.id !== "welcome-cleared")
        .map((m) => ({
          role: m.role,
          content: m.content || (m.id === "welcome" ? localT.welcome : localT.welcomeCleared),
        }));

      const quizStore = useQuizStore.getState();
      const currentContexts = [...selectedContexts];

      if (quizStore && (quizStore.questions.length > 0 || quizStore.quiz.title)) {
        currentContexts.push({
          type: "current_quiz",
          name: "Current Active Quiz",
          data: {
            quiz: quizStore.quiz,
            questions: quizStore.questions
          }
        });
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessageText,
          messages: history,
          lang,
          contexts: currentContexts,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (_) { /* ignore */ }
        throw new Error(
          errorData?.error ||
          (lang === "th"
            ? "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Ollama"
            : lang === "ja"
              ? "Ollamaへの接続中にエラーが発生しました"
              : "An error occurred connecting to Ollama")
        );
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessageContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.model) {
              setActiveModel(parsed.model);
            }
            if (parsed.token) {
              assistantMessageContent += parsed.token;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: assistantMessageContent }
                    : msg
                )
              );
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore parsing errors for partial lines
          }
        }
      }

      if (assistantMessageContent) {
        const match = assistantMessageContent.match(/```json_quiz_update\s*([\s\S]*?)(?:\s*```|$)/);
        if (match && match[1].trim()) {
          try {
            const quizUpdate = parseQuizJson(match[1]);
            console.log("Parsed valid quiz update from AI assistant:", quizUpdate);
          } catch (e: any) {
            console.error("Failed to parse quiz update JSON:", e);
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: lang === "th"
                  ? `⚠️ **ระบบได้รับคำสั่งแต่ไม่สามารถอัปเดตข้อมูลได้:** โครงสร้างข้อมูล JSON ที่ส่งกลับมาจาก AI ไม่ถูกต้องสมบูรณ์ (ข้อผิดพลาด: ${e.message})`
                  : lang === "ja"
                    ? `⚠️ **システムは指示を受信しましたが、更新できませんでした：** AIから返されたJSONデータが破損しています (エラー: ${e.message})`
                    : `⚠️ **Received command but could not update quiz:** The JSON data returned by the AI was malformed or incomplete (Error: ${e.message})`
              }
            ]);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        console.log("Request aborted by user");
        setMessages((prev) => [
          ...prev.filter(m => m.content !== ""),
          {
            id: `stopped-${Date.now()}`,
            role: "assistant",
            content: lang === "th"
              ? "*🛑 การตอบกลับถูกหยุดโดยผู้ใช้*"
              : lang === "ja"
                ? "*🛑 ユーザーによって生成が停止されました*"
                : "*🛑 Response generation stopped by user*"
          }
        ]);
      } else {
        console.error(err);
        setErrorMsg(err.message || localT.errConnect);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const suggestions = [
    "อยากสร้าง Quiz เกี่ยวกับ พื้นฐาน Web Application",
    "ช่วยอธิบายความแตกต่างระหว่าง GET กับ POST",
    "ขอตัวอย่างข้อสอบเกี่ยวกับ React Hooks",
  ];

  if (pathname === "/" || pathname === "/teacher/login" || pathname?.startsWith("/play")) {
    return null;
  }

  return (
    <>
      {/* 1. Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          suppressHydrationWarning
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative p-4 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 transform hover:scale-105 active:scale-[0.95]
            ${isOpen
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
            }
          `}
          aria-label="Toggle AI Assistant"
        >
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-violet-600/30 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/graduate_duck.svg" alt="AI" className="w-full h-full animate-pulse object-contain" />
            </div>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Widget */}
      <AnimatePresence>
        {isOpen && isMaximized && (
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMaximized(false)}
            className="fixed inset-0 bg-zinc-950/40 dark:bg-black/60  z-40 cursor-pointer"
          />
        )}

        {isSelectingContext && (
          <motion.div
            key="ai-inspect-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full border border-violet-200/80 dark:border-violet-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl flex items-center gap-4 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 shadow-violet-500/5 select-none"
          >
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-600 animate-ping" />
              {lang === "th"
                ? "โหมดตรวจสอบ: คลิกเลือก Component บนหน้าเว็บ..."
                : lang === "ja"
                  ? "検証モード：画面上のコンポーネントをクリックしてください..."
                  : "Inspection Mode: Click on a component on the page..."}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectEntirePage}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer border-none flex items-center gap-1 shadow-sm font-bold active:scale-[0.98]"
              >
                <Layers className="w-3 h-3 text-white" />
                {lang === "th" ? "เลือกทั้งหน้า" : lang === "ja" ? "画面全体を選択" : "Select Entire Page"}
              </button>
              <button
                type="button"
                onClick={() => setIsSelectingContext(false)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-955/30 dark:hover:text-rose-455 transition-colors cursor-pointer border-none"
              >
                {lang === "th" ? "ยกเลิก" : lang === "ja" ? "キャンセル" : "Cancel"}
              </button>
            </div>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            layout
            key="ai-chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              fixed z-50 rounded-3xl border border-white/60 dark:border-zinc-800/80
              bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl
              shadow-[0_25px_60px_rgba(109,40,217,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
              flex flex-col overflow-hidden
              ${isMaximized
                ? "inset-4 sm:inset-6 md:inset-8 w-auto h-auto max-w-none max-h-none"
                : "right-6 bottom-24 w-96 max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-8rem)]"
              }
            `}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/80 bg-gradient-to-r from-violet-50/85 to-indigo-50/85 dark:from-zinc-900/60 dark:to-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-100 flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1.5 border border-zinc-200/50 dark:border-zinc-800/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/graduate_duck.svg" alt="AI Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm flex items-center gap-1.5 animate-fade-in">
                    {localT.headerTitle}
                    <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse transition-colors duration-500 ${
                      connectionStatus === "connected"
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : connectionStatus === "checking"
                          ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                          : "bg-rose-500 shadow-sm shadow-rose-500/50"
                    }`} />
                  </h3>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border select-none transition-all duration-300 ${
                      connectionStatus === "connected"
                        ? "bg-violet-100/60 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/30 dark:border-violet-900/30"
                        : connectionStatus === "checking"
                          ? "bg-amber-100/60 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30 dark:border-amber-900/30 animate-pulse"
                          : "bg-rose-100/60 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/30 dark:border-rose-900/30"
                    }`}>
                      {connectionStatus === "connected" ? (activeModel ? activeModel : "Local LLM") : (connectionStatus === "checking" ? "Checking..." : "Offline")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className={`text-zinc-500 hover:text-violet-600 dark:text-zinc-400 bg-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-900 border-none ${
                    connectionStatus === "checking" ? "animate-spin" : ""
                  }`}
                  onClick={checkConnection}
                  aria-label="Check connection status"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-rose-500 dark:text-zinc-400 bg-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-900 border-none"
                  onClick={clearChat}
                  aria-label={localT.clearLabel}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 dark:text-zinc-400 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 border-none"
                  onClick={() => setIsMaximized(!isMaximized)}
                  aria-label={isMaximized ? localT.minimizeLabel : localT.maximizeLabel}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 dark:text-zinc-400 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 border-none"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMaximized(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {connectionStatus === "disconnected" && (
                <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center justify-between gap-2 shadow-sm shadow-rose-500/5 animate-slide-down">
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    {lang === "th" 
                      ? "ตรวจไม่พบ Ollama ในเครื่องของคุณ" 
                      : "Cannot detect local Ollama server"} {ollamaUrl && `(${ollamaUrl})`}
                  </span>
                  <button
                    type="button"
                    onClick={checkConnection}
                    className="px-2.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition-colors shrink-0 shadow-sm cursor-pointer border-none active:scale-[0.98]"
                  >
                    {lang === "th" ? "เชื่อมต่อใหม่" : "Reconnect"}
                  </button>
                </div>
              )}
              <ScrollShadow className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm
                        ${msg.role === "user"
                          ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-violet-500/10"
                          : "bg-white/60 dark:bg-zinc-900/35 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-800/40 rounded-tl-none shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
                        }
                      `}
                    >
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : msg.id === "welcome" ? (
                        <div className="whitespace-pre-wrap">{localT.welcome}</div>
                      ) : msg.id === "welcome-cleared" ? (
                        <div className="whitespace-pre-wrap">{localT.welcomeCleared}</div>
                      ) : (
                        <ReactMarkdown
                          components={{
                            code(props) {
                              const { children, className, node, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || "");
                              const isInline = !match;

                              if (isInline) {
                                return (
                                  <code className="bg-violet-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-400 font-mono text-[12px] font-semibold border border-violet-100/50 dark:border-zinc-800/40" {...rest}>
                                    {children}
                                  </code>
                                );
                              }

                              const lang = match ? match[1] : "";
                              if (lang === "json_quiz_update") {
                                return (
                                  <QuizUpdateSummary
                                    codeString={String(children)}
                                    lang={lang}
                                    isGenerating={isLoading}
                                  />
                                );
                              }

                              return (
                                <CodeBlock
                                  language={lang}
                                  code={String(children).replace(/\n$/, "")}
                                />
                              );
                            },
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-zinc-700 dark:text-zinc-300">{children}</li>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading State / Skeleton */}
                {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant" || !messages[messages.length - 1]?.content) && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-100 flex items-center justify-center shrink-0 p-1 border border-zinc-200/50 dark:border-zinc-800/40 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/graduate_duck.svg" alt="AI Loading" className="w-full h-full animate-bounce object-contain" />
                    </div>
                    <div className="flex flex-col gap-2 max-w-[75%]">
                      <Skeleton className="h-4 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-4 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <Card className="border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-500 text-xs rounded-2xl flex flex-col gap-1.5 shadow-none animate-shake">
                    <p className="font-bold flex items-center gap-1">
                      {localT.errTitle}
                    </p>
                    <p>{errorMsg}</p>
                    <div className="mt-1 border-t border-rose-500/25 pt-1.5 text-[11px] text-rose-500/85">
                      💡 {lang === "th" ? "คำแนะนำ" : lang === "ja" ? "推奨事項" : "Troubleshooting"}: <br />
                      {localT.errGuide1} <br />
                      {localT.errGuide2} <br />
                      <code className="bg-black/30 dark:bg-black/60 px-1 py-0.5 rounded text-[10px] select-all font-mono inline-block mt-0.5">
                        ollama run gemma2
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        checkConnection();
                      }}
                      className="mt-2 w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/10 cursor-pointer border-none active:scale-[0.98]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                      {lang === "th" ? "ตรวจสอบการเชื่อมต่อใหม่" : "Retry Connection"}
                    </button>
                  </Card>
                )}

                <div ref={messagesEndRef} />
              </ScrollShadow>

              {/* Bottom Suggestions Overlay */}
              {messages.length <= 2 && !isLoading && !errorMsg && (
                <div className="px-4 py-2.5 border-t border-zinc-200/50 dark:bg-zinc-950/20 flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1 uppercase tracking-wider">
                    <MessageSquareCode className="w-3.5 h-3.5" /> {localT.suggestedTitle}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {localTranslations[lang as "th" | "en" | "ja"]?.suggestions?.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="
                          w-full text-left px-3 py-2 rounded-xl text-xs
                          bg-white dark:bg-zinc-900/60 hover:bg-violet-50/50 dark:hover:bg-violet-950/20
                          border border-zinc-200/50 dark:border-zinc-800/50 hover:border-violet-300/50 dark:hover:border-violet-850
                          text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400
                          transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]
                        "
                      >
                        <span className="truncate">{suggestion}</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-450 group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Context Reference Badges */}
            {selectedContexts.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-200/50 dark:border-zinc-900/60 bg-violet-50/25 dark:bg-violet-950/10 flex flex-wrap gap-2 items-center">
                {selectedContexts.map((context, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400 font-medium bg-white dark:bg-zinc-900/50 px-2.5 py-1 rounded-xl border border-violet-200/30 dark:border-violet-900/30 max-w-full shrink-0">
                    <div className="px-1.5 py-0.5 rounded-md bg-violet-100/50 dark:bg-violet-950/40 text-[9px] font-bold uppercase border border-violet-200/30 dark:border-violet-900/30 shrink-0">
                      {context.type === "student"
                        ? (lang === "th" ? "นักเรียน" : lang === "ja" ? "学生" : "Student")
                        : context.type === "quiz"
                          ? (lang === "th" ? "แบบทดสอบ" : lang === "ja" ? "クイズ" : "Quiz")
                          : context.type === "page"
                            ? (lang === "th" ? "หน้าเว็บ" : lang === "ja" ? "画面" : "Page")
                            : context.type}
                    </div>
                    <span className="truncate max-w-[120px] font-semibold text-zinc-700 dark:text-zinc-350 font-medium">
                      {context.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedContexts(prev => prev.filter((_, i) => i !== index))}
                      className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex gap-2 items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && input.trim()) {
                      sendMessage();
                    }
                  }
                }}
                placeholder={localT.inputPlaceholder}
                disabled={isLoading}
                rows={1}
                className="flex-1 px-4 py-2 text-sm bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 text-zinc-800 dark:text-zinc-200 transition-all resize-none max-h-32 overflow-y-auto"
              />
              <Button
                type="button"
                isIconOnly
                variant="ghost"
                onClick={() => setIsSelectingContext(!isSelectingContext)}
                className={`
                  rounded-xl border-none bg-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-900 shrink-0
                  ${isSelectingContext ? "text-violet-600 dark:text-violet-400 animate-pulse bg-violet-50 dark:bg-violet-950/40" : "text-zinc-500 dark:text-zinc-400"}
                `}
                aria-label="Select context"
              >
                <Target className="w-4.5 h-4.5" />
              </Button>
              <Button
                type={isLoading ? "button" : "submit"}
                onClick={isLoading ? handleStopGeneration : undefined}
                isIconOnly
                isDisabled={!isLoading && !input.trim()}
                className={`
                  shrink-0 rounded-xl shadow-lg transition-all duration-200
                  ${isLoading
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/15 hover:shadow-rose-500/25 animate-pulse"
                    : "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-500/15 hover:shadow-violet-500/25"
                  }
                `}
                aria-label={isLoading ? "Stop response generation" : "Send message"}
              >
                {isLoading ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
