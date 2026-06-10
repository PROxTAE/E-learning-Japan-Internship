"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar";
import { TeacherTopbar } from "@/components/teacher/layout/TeacherTopbar";
import { isAuthenticated } from "@/lib/auth";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — runs only on client
  useEffect(() => {
    if (pathname === "/teacher/login") {
      setAuthChecked(true);
      return;
    }

    if (!isAuthenticated()) {
      router.replace("/teacher/login");
    } else {
      setAuthChecked(true);
    }
  }, [router, pathname]);

  // Detect screen size on load & resize
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // If visiting login page, render without sidebar layout wrapper
  if (pathname === "/teacher/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 260;

  // Don't render protected content until auth is confirmed
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-default-50 dark:bg-[#0d0d1a] flex overflow-x-hidden">
      {/* Sidebar */}
      <TeacherSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      {/* Backdrop for mobile view */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-35 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main area — offset by sidebar width on desktop, full screen on mobile */}
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-h-screen min-w-0"
      >
        <TeacherTopbar
          onMenuToggle={() => setMobileOpen((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="flex-1">{children}</main>
      </motion.div>
    </div>
  );
}

