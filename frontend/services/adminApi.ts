// ─────────────────────────────────────────────
//  services/adminApi.ts — Super Admin API client
// ─────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";
const ADMIN_TOKEN_KEY = "admin_token";

export interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  department?: string;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// ── Token helpers ─────────────────────────────────────────────
export function setAdminToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
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

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const adminApi = {
  /** Admin login with secret key */
  login: async (secretKey: string): Promise<{ token: string }> => {
    const data = await apiFetch<{ token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ secretKey }),
    });
    setAdminToken(data.token);
    return data;
  },

  logout: (): void => clearAdminToken(),

  /** List all teachers */
  listTeachers: (): Promise<TeacherRecord[]> =>
    apiFetch<TeacherRecord[]>("/api/admin/teachers", { headers: adminHeaders() }),

  /** Create a new teacher */
  createTeacher: (data: { name: string; email: string; password: string; department?: string }): Promise<TeacherRecord> =>
    apiFetch<TeacherRecord>("/api/admin/teachers", {
      method: "POST",
      body: JSON.stringify(data),
      headers: adminHeaders(),
    }),

  /** Update teacher info */
  updateTeacher: (id: string, data: Partial<{ name: string; email: string; password: string; department: string; isActive: boolean }>): Promise<TeacherRecord> =>
    apiFetch<TeacherRecord>(`/api/admin/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: adminHeaders(),
    }),

  /** Deactivate (soft-delete) a teacher */
  deactivateTeacher: (id: string): Promise<TeacherRecord> =>
    apiFetch<TeacherRecord>(`/api/admin/teachers/${id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    }),
};
