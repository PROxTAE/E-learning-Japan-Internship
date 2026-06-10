// ─────────────────────────────────────────────
//  lib/auth.ts — Client-side auth helpers
//  Uses localStorage to store JWT token
// ─────────────────────────────────────────────

const TOKEN_KEY = "teacher_token";

export interface TeacherPayload {
  id: string;
  name: string;
  email: string;
  role: "teacher";
  iat: number;
  exp: number;
}

/** Store the JWT in localStorage */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/** Retrieve the raw JWT from localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Clear the JWT (logout) */
export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** Decode the JWT payload without verifying signature (client-side only) */
function decodeToken(token: string): TeacherPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as TeacherPayload;
  } catch {
    return null;
  }
}

/** Get the decoded teacher payload from the stored token */
export function getTeacher(): TeacherPayload | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  // Check expiry
  if (payload.exp * 1000 < Date.now()) {
    clearToken();
    return null;
  }
  return payload;
}

/** Returns true if a valid, non-expired token exists */
export function isAuthenticated(): boolean {
  return getTeacher() !== null;
}

/** Add the Authorization header to fetch options if logged in */
export function withAuth(init: RequestInit = {}): RequestInit {
  const token = getToken();
  if (!token) return init;
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
