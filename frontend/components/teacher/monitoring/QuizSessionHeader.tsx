"use client";

import { useEffect, useState } from "react";
import { Button, Input, Dropdown, Switch, Label, Tooltip } from "@heroui/react";
import { Search, Filter, Pause, Play, Download, Lock, Unlock, RefreshCw, Clock, ChevronLeft, ChevronRight, Presentation, Copy, Share2, Check } from "lucide-react";
import { MonitoringState } from "@/types/teacher/monitoring.types";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useMonitoringStore } from "@/store/monitoringStore";
import { ConfirmModal } from "./ConfirmModal";
import { monitoringApi } from "@/services/monitoringApi";

interface QuizSessionHeaderProps {
  quizTitle: string;
  quizCode: string;
  state: MonitoringState;
  onStateChange: (newState: Partial<MonitoringState>) => void;
  sessionId?: string;
  onShare?: () => void;
}

export function QuizSessionHeader({ quizTitle, quizCode, state, onStateChange, sessionId, onShare }: QuizSessionHeaderProps) {
  const { t } = useLang();
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const {
    timer,
    timerActive,
    isLocked,
    accessCode,
    isTeacherLed,
    currentQuestionIndex,
    questions,
    setTimer,
    setTimerActive,
    adjustTimer,
    setAccessCode,
    setRoomLocked,
    setTeacherLed,
    setCurrentQuestionIndex,
  } = useMonitoringStore();

  const handleCopyCode = () => {
    const code = accessCode || quizCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Sync prop quizCode to store if empty
  useEffect(() => {
    if (quizCode && !accessCode) {
      setAccessCode(quizCode);
    }
  }, [quizCode, accessCode, setAccessCode]);

  // Format timer into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const confirmRegenerateCode = () => {
    monitoringApi.controlSession(sessionId || "", "regenerate_code");
    setShowRegenConfirm(false);
  };

  const handleSetTimer = (minutes: number) => {
    monitoringApi.controlSession(sessionId || "", "set_timer", { timer: minutes * 60, timerActive: true });
  };

  return (
    <div className="flex flex-col gap-4 mb-6 p-4 rounded-2xl bg-default-50 border border-white/5 backdrop-blur-md shadow-sm">
      {/* Top Row: Title, Access Code, Lock and Refresh buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              {quizTitle}
            </h1>
            
            {/* Access Code Badge & Actions */}
            <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-1">
              <span className="text-xs font-mono font-bold text-purple-300">
                Code: {accessCode || quizCode || "------"}
              </span>
              
              <div className="h-3 w-px bg-purple-500/30 mx-1" />

              {/* Copy Code Button */}
              {/* @ts-expect-error HeroUI Tooltip types issue */}
              <Tooltip content={copied ? "Copied!" : "Copy Code"}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="w-5 h-5 min-w-0 p-0 text-purple-300 hover:text-purple-100"
                  onPress={handleCopyCode}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </Tooltip>
              
              <div className="h-3 w-px bg-purple-500/30 mx-1" />
              
              {/* Lock/Unlock Button */}
              {/* @ts-expect-error HeroUI Tooltip types issue */}
              <Tooltip content={isLocked ? t.monitoring.accessCode.unlock : t.monitoring.accessCode.lock}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="w-5 h-5 min-w-0 p-0 text-purple-300 hover:text-purple-100"
                  onPress={() => monitoringApi.controlSession(sessionId || "", isLocked ? "unlock" : "lock")}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5 text-danger" /> : <Unlock className="w-3.5 h-3.5" />}
                </Button>
              </Tooltip>
 
              {/* Regenerate Button */}
              {/* @ts-expect-error HeroUI Tooltip types issue */}
              <Tooltip content={t.monitoring.accessCode.regenerate}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="w-5 h-5 min-w-0 p-0 text-purple-300 hover:text-purple-100"
                  onPress={() => setShowRegenConfirm(true)}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </Tooltip>

              {/* Share Button */}
              {onShare && (
                <>
                  <div className="h-3 w-px bg-purple-500/30 mx-1" />
                  {/* @ts-expect-error HeroUI Tooltip types issue */}
                  <Tooltip content="Share Quiz">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="w-5 h-5 min-w-0 p-0 text-purple-300 hover:text-purple-100"
                      onPress={onShare}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </Tooltip>
                </>
              )}
            </div>
            
            {/* Locked Badge */}
            {isLocked && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-danger-500/20 text-danger border border-danger-500/30 rounded-md">
                {t.monitoring.accessCode.roomLocked}
              </span>
            )}
          </div>
          <p className="text-sm text-default-400 mt-1">Real-time Session Monitoring</p>
        </div>
 
        {/* Live Timer Controls */}
        <div className="flex items-center gap-2 bg-default-100 p-1.5 rounded-2xl border border-default-200/40">
          <Clock className="w-4 h-4 text-purple-500 ml-1.5" />
          
          {timer > 0 ? (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono font-black px-2 py-0.5 rounded-lg ${timer <= 60 ? "text-danger animate-pulse bg-danger-500/10" : "text-purple-600 dark:text-purple-400 bg-purple-500/10"}`}>
                {formatTime(timer)}
              </span>
              
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="w-7 h-7 min-w-0 p-0 rounded-lg text-default-600 dark:text-default-300"
                onPress={() => monitoringApi.controlSession(sessionId || "", "set_timer", { timer, timerActive: !timerActive })}
              >
                {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
 
              <Button
                size="sm"
                variant="ghost"
                className="text-[10px] font-bold min-w-0 px-2 h-7 rounded-lg"
                onPress={() => monitoringApi.controlSession(sessionId || "", "set_timer", { timer: timer + 60, timerActive })}
              >
                {t.monitoring.timer.addMin}
              </Button>
 
              <Button
                size="sm"
                variant="ghost"
                className="text-[10px] font-bold min-w-0 px-2 h-7 rounded-lg text-danger-500"
                onPress={() => monitoringApi.controlSession(sessionId || "", "set_timer", { timer: Math.max(0, timer - 60), timerActive })}
              >
                {t.monitoring.timer.subMin}
              </Button>
            </div>
          ) : (
            <Dropdown>
              <Button size="sm" variant="ghost" className="text-xs font-bold text-default-600">
                {t.monitoring.timer.setDuration}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => handleSetTimer(Number(key))}
                >
                  <Dropdown.Item id="5" textValue="5 Mins"><Label>5 {t.monitoring.timer.mins}</Label></Dropdown.Item>
                  <Dropdown.Item id="10" textValue="10 Mins"><Label>10 {t.monitoring.timer.mins}</Label></Dropdown.Item>
                  <Dropdown.Item id="15" textValue="15 Mins"><Label>15 {t.monitoring.timer.mins}</Label></Dropdown.Item>
                  <Dropdown.Item id="20" textValue="20 Mins"><Label>20 {t.monitoring.timer.mins}</Label></Dropdown.Item>
                  <Dropdown.Item id="30" textValue="30 Mins"><Label>30 {t.monitoring.timer.mins}</Label></Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
      </div>
 
      {/* Divider */}
      <div className="h-px bg-default-100" />
 
      {/* Bottom Row: Presentation Controls & Existing Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        {/* Presentation controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-default-100 border border-default-200/40">
            <Presentation className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-gray-800 dark:text-foreground">
              {isTeacherLed ? t.monitoring.controls.presentationMode : t.monitoring.controls.selfPacedMode}
            </span>
            <Switch
              size="sm"
              isSelected={isTeacherLed}
              onChange={(checked: any) => {
                const val = typeof checked === "boolean" ? checked : !!checked.target?.checked;
                monitoringApi.controlSession(sessionId || "", "teacher_led", { isTeacherLed: val });
              }}
            />
          </div>
 
          {isTeacherLed && questions.length > 0 && (
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl px-3 py-1 animate-fade-in">
              <span className="text-xs font-bold text-purple-400">
                {t.monitoring.controls.activeQuestion}: {currentQuestionIndex + 1} / {questions.length}
              </span>
              
              <div className="h-3 w-px bg-purple-500/20 mx-1" />
 
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={currentQuestionIndex === 0}
                className="w-6 h-6 min-w-0 p-0 rounded-full text-purple-400 hover:text-purple-200"
                onPress={() => monitoringApi.controlSession(sessionId || "", "set_question_index", { index: currentQuestionIndex - 1 })}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
 
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={currentQuestionIndex === questions.length - 1}
                className="w-6 h-6 min-w-0 p-0 rounded-full text-purple-400 hover:text-purple-200"
                onPress={() => monitoringApi.controlSession(sessionId || "", "set_question_index", { index: currentQuestionIndex + 1 })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Existing search query, filter and play/pause controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          <div className="relative w-full sm:w-48">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-default-400 z-10 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <Input
              placeholder={t.monitoring.search}
              value={state.searchQuery}
              onChange={(e) => onStateChange({ searchQuery: e.target.value })}
              className="w-full pl-9 h-8 bg-default-100 rounded-md border-transparent text-sm"
            />
          </div>

          <Dropdown>
            <Button size="sm" variant="secondary" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t.monitoring.filter.all}: {t.monitoring.filter[state.filter as keyof typeof t.monitoring.filter] || state.filter}
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu 
                selectionMode="single" 
                selectedKeys={new Set([state.filter])}
                onSelectionChange={(keys) => onStateChange({ filter: Array.from(keys as Set<string>)[0] as any })}
              >
                <Dropdown.Item id="all" textValue={t.monitoring.filter.all}><Label>{t.monitoring.filter.all}</Label></Dropdown.Item>
                <Dropdown.Item id="incorrect" textValue={t.monitoring.filter.incorrect}><Label>{t.monitoring.filter.incorrect}</Label></Dropdown.Item>
                <Dropdown.Item id="completed" textValue={t.monitoring.filter.completed}><Label>{t.monitoring.filter.completed}</Label></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-default-100">
            <span className="text-xs font-medium text-default-500">Heatmap</span>
            <Switch 
              size="sm" 
              isSelected={state.heatmapMode}
              onChange={(checked: any) => onStateChange({ heatmapMode: !!checked })}
            />
          </div>

          <Button 
            size="sm" 
            variant={state.isPaused ? "secondary" : "primary"}
            className="flex items-center gap-2"
            onPress={() => onStateChange({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {state.isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            onPress={() => {
              const code = accessCode || quizCode || sessionId || "";
              const url = `${process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000"}/api/monitoring/sessions/${code}/export`;
              window.open(url, "_blank");
            }}
          >
            <Download className="w-4 h-4" />
            {t.detail.exportReport || "Export CSV"}
          </Button>

          <Button 
            size="sm"
            variant="danger-soft"
            className="flex items-center gap-2 font-bold"
            onPress={() => onStateChange({ isEnded: true } as any)}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* HeroUI Confirm Modal for code regeneration */}
      <ConfirmModal
        isOpen={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={confirmRegenerateCode}
        title={t.monitoring.accessCode.regenerate}
        message={t.monitoring.accessCode.regenerate + "?"}
        confirmText={t.monitoring.controls.regenerateText}
        cancelText={t.modal.cancel}
        isDanger={true}
      />
    </div>
  );
}
