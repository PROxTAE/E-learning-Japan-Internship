"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@heroui/react";
import {
  Shield, Plus, Pencil, PowerOff, Power, Eye, EyeOff,
  Users, Mail, Key, Building2, RefreshCw, X, Check, LogOut
} from "lucide-react";
import { adminApi, getAdminToken, clearAdminToken, type TeacherRecord } from "@/services/adminApi";

// ── Admin Login Screen ──────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await adminApi.login(key);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Invalid secret key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d1a] via-[#18102b] to-[#1a0d2e]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Super Admin</h1>
              <p className="text-xs text-white/40">E-Learning Platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Admin Secret Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input
                  id="admin-secret-key"
                  type={show ? "text" : "password"}
                  placeholder="Enter admin secret key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button id="admin-login-btn" type="submit" variant="primary" isDisabled={isLoading} className="w-full h-10 font-semibold text-sm flex items-center justify-center gap-2">
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Teacher Form Modal ──────────────────────────────────────────
interface TeacherFormData {
  name: string;
  email: string;
  password: string;
  department: string;
}

function TeacherModal({
  teacher,
  onClose,
  onSave,
}: {
  teacher?: TeacherRecord | null;
  onClose: () => void;
  onSave: (data: TeacherFormData) => Promise<void>;
}) {
  const isEdit = !!teacher;
  const [form, setForm] = useState<TeacherFormData>({
    name: teacher?.name || "",
    email: teacher?.email || "",
    password: "",
    department: teacher?.department || "",
  });
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setIsLoading(false);
    }
  };

  const field = (label: string, id: string, type: string, value: string, onChange: (v: string) => void, placeholder: string, icon: React.ReactNode, required = false) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">{icon}</span>
        <Input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full pl-9 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#18102b] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{isEdit ? "Edit Teacher" : "Add New Teacher"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field("Full Name", "t-name", "text", form.name, v => setForm(f => ({ ...f, name: v })), "Tanaka Sensei", <Users className="w-4 h-4" />, true)}
          {field("Email", "t-email", "email", form.email, v => setForm(f => ({ ...f, email: v })), "teacher@school.ac.jp", <Mail className="w-4 h-4" />, true)}
          <div className="space-y-1.5">
            <label htmlFor="t-password" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Password {isEdit && <span className="text-white/30">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <Input id="t-password" type={showPw ? "text" : "password"} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={isEdit ? "New password (optional)" : "Min. 6 characters"} required={!isEdit}
                className="w-full pl-9 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {field("Department", "t-dept", "text", form.department, v => setForm(f => ({ ...f, department: v })), "Computer Science", <Building2 className="w-4 h-4" />)}
          {error && <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-semibold transition-colors">
              Cancel
            </button>
            <Button id="save-teacher-btn" type="submit" variant="primary" isDisabled={isLoading} className="flex-1 h-10 font-semibold text-sm flex items-center justify-center gap-2">
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Admin Dashboard ────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalTeacher, setModalTeacher] = useState<TeacherRecord | null | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if already authed
  useEffect(() => {
    if (getAdminToken()) setAuthed(true);
  }, []);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminApi.listTeachers();
      setTeachers(list);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("admin")) {
        clearAdminToken();
        setAuthed(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadTeachers();
  }, [authed, refreshKey, loadTeachers]);

  const handleSaveTeacher = async (data: { name: string; email: string; password: string; department: string }) => {
    if (modalTeacher) {
      // Edit
      const update: any = { name: data.name, email: data.email, department: data.department };
      if (data.password) update.password = data.password;
      await adminApi.updateTeacher(modalTeacher.id, update);
    } else {
      // Create
      await adminApi.createTeacher(data);
    }
    setRefreshKey(k => k + 1);
  };

  const handleToggleActive = async (teacher: TeacherRecord) => {
    await adminApi.updateTeacher(teacher.id, { isActive: !teacher.isActive });
    setRefreshKey(k => k + 1);
  };

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  const activeCount = teachers.filter(t => t.isActive).length;
  const inactiveCount = teachers.length - activeCount;

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      {/* Modals */}
      <AnimatePresence>
        {modalTeacher !== undefined && (
          <TeacherModal
            teacher={modalTeacher}
            onClose={() => setModalTeacher(undefined)}
            onSave={handleSaveTeacher}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="border-b border-white/10 bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">Super Admin Panel</h1>
              <p className="text-xs text-white/30">E-Learning Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRefreshKey(k => k + 1)}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => { clearAdminToken(); setAuthed(false); }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 text-xs font-semibold transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Teachers", value: teachers.length, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: activeCount, color: "text-success", bg: "bg-success/10" },
            { label: "Inactive", value: inactiveCount, color: "text-default-400", bg: "bg-white/5" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-white/10 ${s.bg} p-4`}>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Teachers table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-white">Teacher Accounts</h2>
            </div>
            <Button
              id="add-teacher-btn"
              variant="primary"
              size="sm"
              onClick={() => setModalTeacher(null)}
              className="flex items-center gap-1.5 text-xs font-semibold h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Teacher
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold">No teachers yet</p>
              <p className="text-xs mt-1">Click &quot;Add Teacher&quot; to create the first account</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-6 py-2.5 bg-white/[0.02]">
                {["Name / Email", "Department", "Status", "Actions"].map(h => (
                  <span key={h} className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {/* Rows */}
              {teachers.map(teacher => (
                <motion.div key={teacher.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${teacher.isActive ? "text-white" : "text-white/40 line-through"}`}>
                      {teacher.name}
                    </p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      {teacher.email}
                    </p>
                  </div>
                  <p className="text-xs text-white/40">{teacher.department || "—"}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                    teacher.isActive ? "bg-success/15 text-success" : "bg-white/5 text-white/30"
                  }`}>
                    {teacher.isActive ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    {teacher.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModalTeacher(teacher)}
                      className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/30 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(teacher)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                        teacher.isActive
                          ? "border-white/10 text-white/40 hover:text-danger hover:border-danger/30"
                          : "border-white/10 text-white/40 hover:text-success hover:border-success/30"
                      }`}
                      title={teacher.isActive ? "Deactivate" : "Reactivate"}
                    >
                      {teacher.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
