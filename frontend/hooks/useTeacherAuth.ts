"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTeacher, clearToken, type TeacherPayload } from "@/lib/auth";
import { authApi, type TeacherProfile } from "@/services/authApi";

export interface UseTeacherAuthReturn {
  teacher: TeacherPayload | null;
  profile: TeacherProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useTeacherAuth(): UseTeacherAuthReturn {
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherPayload | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const payload = getTeacher();
    setTeacher(payload);
    setIsLoading(false);

    // Optionally fetch full profile from API
    if (payload) {
      authApi.getMe().then(setProfile).catch(() => {
        // Token may be invalid — clear and redirect
        clearToken();
        setTeacher(null);
      });
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setTeacher(null);
    setProfile(null);
    router.push("/teacher/login");
  }, [router]);

  return {
    teacher,
    profile,
    isLoading,
    isAuthenticated: teacher !== null,
    logout,
  };
}
