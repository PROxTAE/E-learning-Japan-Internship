"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar";
import { TeacherTopbar } from "@/components/teacher/layout/TeacherTopbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-default-50 dark:bg-[#0d0d1a] flex">
      {/* Sidebar */}
      <TeacherSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      {/* Main area — offset by sidebar width */}
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-h-screen min-w-0"
      >
        <TeacherTopbar
          onMenuToggle={() => setCollapsed((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="">{children}</main>
      </motion.div>
    </div>
  );
}
