"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Input } from "@heroui/react";
import { Eye, EyeOff, Brain, Zap, Shield, Lock, Mail } from "lucide-react";
import { authApi } from "@/services/authApi";
import { isAuthenticated } from "@/lib/auth";
import { useLang } from "@/lib/i18n/LanguageContext";

export default function TeacherLoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const L = t.login;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/teacher");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.login(email.trim(), password);
      router.replace("/teacher");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0d0d1a] via-[#18102b] to-[#1a0d2e] overflow-hidden">
      {/* Left decorative panel */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
      >
        {/* Gradient orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-purple-700/15 blur-[100px] pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">E-Learning</span>
          </div>
          <p className="text-white/40 text-sm">{L.subtitle}</p>
        </div>

        {/* Center feature list */}
        <div className="relative z-10 space-y-6">
          {[
            { icon: Zap, title: "Real-Time Monitoring", desc: "Track every student in your classroom live" },
            { icon: Brain, title: "AI Teaching Assistant", desc: "Smart recommendations powered by local LLM" },
            { icon: Shield, title: "Data Isolation", desc: "Your quizzes, sessions and results — private" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-white/40 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/20 text-xs">{L.tagline}</p>
      </motion.div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <span className="text-white font-bold text-lg">E-Learning</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">{L.title}</h1>
              <p className="text-white/40 text-sm mt-1">{L.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  {L.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input
                    id="teacher-email"
                    type="email"
                    placeholder={L.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-9 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  {L.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input
                    id="teacher-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={L.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20"
                >
                  <Shield className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-danger text-xs font-semibold">{L.errorTitle}</p>
                    <p className="text-danger/70 text-xs mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <Button
                id="teacher-login-btn"
                type="submit"
                variant="primary"
                isDisabled={isLoading}
                className="w-full h-11 font-semibold text-sm mt-2 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isLoading ? L.signingIn : L.signIn}
              </Button>
            </form>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            E-Learning Platform · Teacher Portal
          </p>
        </motion.div>
      </div>
    </div>
  );
}
