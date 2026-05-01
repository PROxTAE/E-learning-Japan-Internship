"use client";

import { useState } from "react";
import { Search, Bell, Menu, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface TeacherTopbarProps {
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function TeacherTopbar({ onMenuToggle, searchQuery, onSearchChange }: TeacherTopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useLang();

  return (
    <header className="h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-default-200/50 dark:border-default-700/30 bg-white/80 dark:bg-white/5 backdrop-blur-xl sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-default-500 hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t.topbar.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-default-200/50 dark:border-default-700/30 bg-default-100 dark:bg-default-50/10 text-default-900 dark:text-default-100 placeholder-default-400 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language Switcher */}
        <LanguageSwitcher />
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-xl text-default-500 hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              3
            </span>
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-3 border-l border-default-200/50 dark:border-default-700/30 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-default-700 dark:text-default-200 leading-tight">
                Ms. Tanaka
              </p>
              <p className="text-[10px] text-default-400 leading-tight">Teacher</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
              T
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-default-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1a1a2e] border border-default-200/50 dark:border-default-700/30 rounded-xl shadow-xl z-20 overflow-hidden">
                {[
                  { icon: User, label: t.topbar.myProfile },
                  { icon: Settings, label: t.topbar.settings },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-default-600 dark:text-default-300 hover:bg-default-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-default-100 dark:border-default-700/30" />
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut className="w-4 h-4" />
                  {t.topbar.logout}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
