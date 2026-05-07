"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Users, CalendarDays,
  BarChart2, Settings, LogOut, GraduationCap,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

const NAV_KEYS = [
  { key: "dashboard" as const, icon: LayoutDashboard, href: "/teacher/dashboard" },
  { key: "quizzes"   as const, icon: BookOpen,        href: "/teacher/quizzes" },
  { key: "students"  as const, icon: Users,           href: "/teacher/students" },
  { key: "calendar"  as const, icon: CalendarDays,    href: "/teacher/calendar" },
  { key: "reports"   as const, icon: BarChart2,       href: "/teacher/reports" },
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
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
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
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-white/80 dark:bg-white/5 backdrop-blur-xl border-r border-default-200/50 dark:border-default-700/30 overflow-hidden"
    >
      {/* Brand */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-4 h-16 border-b border-default-200/50 dark:border-default-700/30 w-full hover:bg-default-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
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

      <div className="mx-3 border-t border-default-200/30 dark:border-default-700/20" />

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
