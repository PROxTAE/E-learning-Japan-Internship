// ─────────────────────────────────────────────
//  services/authApi.ts — Teacher auth API client
// ─────────────────────────────────────────────
import { setToken, clearToken, getToken, type TeacherPayload } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  department?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers, ...restInit } = init || {};
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...headers },
    ...restInit,
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  return body.data as T;
}

export const authApi = {
  /** Login with email + password. Stores token in localStorage on success. */
  login: async (email: string, password: string): Promise<{ token: string; teacher: TeacherProfile }> => {
    const data = await apiFetch<{ token: string; teacher: TeacherProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  /** Logout: clears token from localStorage */
  logout: (): void => {
    clearToken();
  },

  /** Fetch the current teacher profile (uses stored token) */
  getMe: async (): Promise<TeacherProfile> => {
    const token = getToken();
    return apiFetch<TeacherProfile>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
