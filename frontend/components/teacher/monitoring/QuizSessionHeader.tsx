"use client";

import { Button, Input, Dropdown, Switch, Label } from "@heroui/react";
import { Search, Filter, Pause, Play, Download } from "lucide-react";
import { MonitoringState } from "@/types/teacher/monitoring.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizSessionHeaderProps {
  quizTitle: string;
  quizCode: string;
  state: MonitoringState;
  onStateChange: (newState: Partial<MonitoringState>) => void;
}

export function QuizSessionHeader({ quizTitle, quizCode, state, onStateChange }: QuizSessionHeaderProps) {
  const { t } = useLang();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 rounded-2xl bg-default-50 border border-white/5 backdrop-blur-md shadow-sm">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            {quizTitle}
          </h1>
          <span className="px-2 py-1 text-xs font-mono font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
            Code: {quizCode}
          </span>
        </div>
        <p className="text-sm text-default-400 mt-1">Real-time Session Monitoring</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-48">
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
          {...{ size: "sm", color: "danger", variant: "flat" } as any}
          className="flex items-center gap-2 font-bold ml-2"
          onPress={() => onStateChange({ isEnded: true } as any)} // Let the parent component handle the actual ending logic
        >
          End Session
        </Button>
      </div>
    </div>
  );
}
