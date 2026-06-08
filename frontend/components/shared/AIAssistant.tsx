"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, ScrollShadow, Skeleton, Card } from "@heroui/react";
import { Sparkles, Send, X, Bot, Trash2, ArrowUpRight, MessageSquareCode, Maximize2, Minimize2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useContextSelector, type AIContext } from "@/hooks/useContextSelector";

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

export default function AIAssistant() {
  const { lang } = useLang();
  const localT = localTranslations[lang] || localTranslations.en;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "", // Content will be loaded dynamically based on language
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedContext, setSelectedContext] = useState<AIContext | null>(null);
  const [isSelectingContext, setIsSelectingContext] = useState(false);

  useContextSelector(isSelectingContext, (context) => {
    setSelectedContext(context);
    setIsSelectingContext(false);
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Quick Suggestions
  const handleSuggestionClick = (suggestionText: string) => {
    setInput(suggestionText);
  };

  // Clear Chat History
  const clearChat = () => {
    setMessages([
      {
        id: "welcome-cleared",
        role: "assistant",
        content: "",
      },
    ]);
    setSelectedContext(null);
    setErrorMsg(null);
  };

  // Send message to Next.js API Route (which calls Ollama)
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput("");
    setErrorMsg(null);

    // Create user message object
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Map existing messages to API format
      const history = messages
        .filter((m) => m.id !== "welcome" && m.id !== "welcome-cleared")
        .map((m) => ({
          role: m.role,
          content: m.content || (m.id === "welcome" ? localT.welcome : localT.welcomeCleared),
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessageText,
          messages: history,
          lang,
          context: selectedContext,
        }),
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

      // Add assistant message placeholder
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
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + parsed.token }
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
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || localT.errConnect);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "อยากสร้าง Quiz เกี่ยวกับ พื้นฐาน Web Application",
    "ช่วยอธิบายความแตกต่างระหว่าง GET กับ POST",
    "ขอตัวอย่างข้อสอบเกี่ยวกับ React Hooks",
  ];

  return (
    <>
      {/* 1. Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          suppressHydrationWarning
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative p-4 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 transform hover:scale-105 active:scale-95
            ${isOpen
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-brand-primary hover:bg-brand-primary-hover text-white"
            }
          `}
          aria-label="Toggle AI Assistant"
        >
          {/* Subtle pulse ring around button */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-violet-600/30 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6 animate-pulse" />
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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full border border-violet-250/80 dark:border-violet-850/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl flex items-center gap-4 text-xs sm:text-sm font-semibold text-zinc-850 dark:text-zinc-100 shadow-violet-500/5 select-none"
          >
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-600 animate-ping" />
              {lang === "th"
                ? "โหมดตรวจสอบ: คลิกเลือก Component บนหน้าเว็บ..."
                : lang === "ja"
                  ? "検証モード：画面上のコンポーネントをクリックしてください..."
                  : "Inspection Mode: Click on a component on the page..."}
            </span>
            <button
              type="button"
              onClick={() => setIsSelectingContext(false)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer border-none"
            >
              {lang === "th" ? "ยกเลิก" : lang === "ja" ? "キャンセル" : "Cancel"}
            </button>
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
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-800/80 bg-bg-secondary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-850 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                    {localT.headerTitle}
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100/60 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/30 dark:border-violet-900/30 select-none">
                      {activeModel ? activeModel : "Local LLM"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
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
                          ? "bg-brand-primary text-white rounded-tr-none shadow-sm"
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
                                  <code className="bg-violet-50 dark:bg-zinc-850 px-1.5 py-0.5 rounded text-violet-750 dark:text-violet-400 font-mono text-[12px] font-semibold border border-violet-100/50 dark:border-zinc-800/40" {...rest}>
                                    {children}
                                  </code>
                                );
                              }

                              return (
                                <CodeBlock
                                  language={match ? match[1] : ""}
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
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Bot className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="flex flex-col gap-2 max-w-[75%]">
                      <Skeleton className="h-4 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-4 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <Card className="border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-500 text-xs rounded-2xl flex flex-col gap-1.5 shadow-none">
                    <p className="font-bold flex items-center gap-1">
                      {localT.errTitle}
                    </p>
                    <p>{errorMsg}</p>
                    <div className="mt-1 border-t border-rose-500/20 pt-1.5 text-[11px] text-rose-500/85">
                      💡 {lang === "th" ? "คำแนะนำ" : lang === "ja" ? "推奨事項" : "Troubleshooting"}: <br />
                      {localT.errGuide1} <br />
                      {localT.errGuide2} <br />
                      <code className="bg-black/30 dark:bg-black/60 px-1 py-0.5 rounded text-[10px] select-all font-mono inline-block mt-0.5">
                        ollama run gemma2
                      </code>
                    </div>
                  </Card>
                )}

                <div ref={messagesEndRef} />
              </ScrollShadow>

              {/* Bottom Suggestions Overlay (Visible if chat is short) */}
              {messages.length <= 2 && !isLoading && !errorMsg && (
                <div className="px-4 py-2.5 border-t border-zinc-150 dark:border-zinc-900/60 bg-zinc-50/60 dark:bg-zinc-950/20 flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1 uppercase tracking-wider">
                    <MessageSquareCode className="w-3.5 h-3.5" /> {localT.suggestedTitle}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {localT.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="
                          w-full text-left px-3 py-2 rounded-xl text-xs
                          bg-white dark:bg-zinc-900/60 hover:bg-violet-50/50 dark:hover:bg-violet-950/20
                          border border-zinc-200/50 dark:border-zinc-800/50 hover:border-violet-300/50 dark:hover:border-violet-850
                          text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-300
                          transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]
                        "
                      >
                        <span className="truncate">{suggestion}</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Context Reference Badge */}
            {selectedContext && (
              <div className="px-4 py-2 border-t border-zinc-150 dark:border-zinc-900/60 bg-violet-50/25 dark:bg-violet-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-violet-750 dark:text-violet-400 font-medium">
                  <div className="px-1.5 py-0.5 rounded-md bg-violet-100/50 dark:bg-violet-950/40 text-[9px] font-bold uppercase border border-violet-200/30 dark:border-violet-900/30">
                    {selectedContext.type === "student" ? (lang === "th" ? "นักเรียน" : lang === "ja" ? "学生" : "Student") : selectedContext.type === "quiz" ? (lang === "th" ? "แบบทดสอบ" : lang === "ja" ? "クイズ" : "Quiz") : selectedContext.type}
                  </div>
                  <span className="truncate max-w-[200px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {selectedContext.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContext(null)}
                  className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={localT.inputPlaceholder}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 text-zinc-800 dark:text-zinc-200 transition-all"
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
                type="submit"
                isIconOnly
                isDisabled={isLoading || !input.trim()}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
