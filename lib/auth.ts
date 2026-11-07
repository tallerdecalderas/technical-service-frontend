import "server-only";

import { cookies } from "next/headers";
import type { SessionUser } from "@/types";
import { getAuthAPIURL } from "@/lib/auth-api";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tech-service-session";

interface SessionResponse {
  success: boolean;
  data?: SessionUser;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  const response = await fetch(`${getAuthAPIURL()}/api/v1/auth/session`, {
    headers: {
      cookie: `${SESSION_COOKIE}=${encodeURIComponent(sessionCookie.value)}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Authentication service returned HTTP ${response.status}`);
  }
  const result = (await response.json()) as SessionResponse;
  const user = result.data;
  if (
    !result.success ||
    !user?.id ||
    !user.email ||
    (user.role !== "ADMIN" && user.role !== "TECHNICIAN")
  ) {
    throw new Error("Authentication service returned an invalid session");
  }
  return user;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}
