"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Users, CalendarDays,
  BarChart2, Settings, LogOut, GraduationCap,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { GradFlowerCharacter, AnimeRobotCharacter } from "@/components/shared/ThemeCharacters";

const NAV_KEYS = [
  { key: "dashboard" as const, icon: LayoutDashboard, href: "/teacher/dashboard" },
  { key: "quizzes" as const, icon: BookOpen, href: "/teacher/quizzes" },
  { key: "students" as const, icon: Users, href: "/teacher/students" },
  { key: "calendar" as const, icon: CalendarDays, href: "/teacher/calendar" },
  { key: "reports" as const, icon: BarChart2, href: "/teacher/reports" },
];

const BOTTOM_KEYS = [
  { key: "settings" as const, icon: Settings, href: "/teacher/settings", danger: false },
  { key: "logout" as const, icon: LogOut, href: "/", danger: true },
];

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface NavItemProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isActive?: boolean;
  danger?: boolean;
  collapsed: boolean;
}

function NavItem({ label, icon: Icon, href, isActive, danger, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
        isActive
          ? "bg-[var(--theme-primary)] text-[var(--theme-primary-fg)] shadow-[3px_3px_0px_var(--theme-text-main)] dark:shadow-[3px_3px_0px_var(--theme-primary)] font-bold border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-primary)]"
          : danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-default-500 hover:bg-default-100 hover:text-default-900 dark:hover:bg-default-50/10 dark:hover:text-default-100"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
      {isActive && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
    </Link>
  );
}

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function TeacherSidebar({ collapsed, onToggle }: TeacherSidebarProps) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col
        bg-white dark:bg-[#080C14]
        border-r-2 border-[var(--theme-border)] dark:border-[var(--theme-primary)]/20
        backdrop-blur-xl overflow-hidden"
    >
      {/* Brand */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-4 h-16 border-b border-default-200/50 dark:border-default-700/30 w-full hover:bg-default-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="shrink-0 flex items-center justify-center">
          <AnimeRobotCharacter size={38} />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left overflow-hidden">
            <p className="text-sm font-bold text-default-900 dark:text-default-100 whitespace-nowrap">
              {t.nav.brand}
            </p>
            <p className="text-xs text-default-400 whitespace-nowrap">{t.nav.portalSubtitle}</p>
          </motion.div>
        )}
      </button>

      {/* Main Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_KEYS.map((item) => (
          <NavItem
            key={item.key}
            label={t.nav[item.key]}
            icon={item.icon}
            href={item.href}
            collapsed={collapsed}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className="mx-3 border-t border-default-200/30 dark:border-[var(--theme-primary)]/20" />

      {!collapsed && (
        <div className="px-4 py-2 flex justify-center opacity-90 hover:opacity-100 transition-opacity pointer-events-none select-none">
          <AnimeRobotCharacter size={76} />
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="px-2 py-4 flex flex-col gap-1">
        {BOTTOM_KEYS.map((item) => (
          <NavItem
            key={item.key}
            label={t.nav[item.key]}
            icon={item.icon}
            href={item.href}
            collapsed={collapsed}
            danger={item.danger}
          />
        ))}
      </nav>
    </motion.aside>
  );
}
