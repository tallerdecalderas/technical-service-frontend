"use client";

import type { SessionUser } from "@/types";

/* ─── Configuración ──────────────────────────────────────────────────────── */

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (typeof window !== "undefined" ? window.location.origin : "");

if (!API_ORIGIN) {
  throw new Error("NEXT_PUBLIC_API_URL is required");
}

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "tech-service-session";
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME ?? "tech-service-csrf";

/* ─── Tipos de transporte ───────────────────────────────────────────────── */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

/* ─── Cliente HTTP ───────────────────────────────────────────────────────── */

class ApiClient {
  private base: string;

  constructor(baseOrigin: string) {
    this.base = baseOrigin.replace(/\/$/, "") + "/api/v1";
  }

  /** Lee una cookie del navegador (cliente) o del header (servidor) */
  private getCookie(name: string, cookies?: string): string | null {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${name}=([^;]*)`)
      );
      return match ? decodeURIComponent(match[1]) : null;
    }
    if (cookies) {
      const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
    return null;
  }

  /** Construye headers comunes para una petición */
  private headers(
    init: RequestInit = {},
    cookies?: string,
    idempotencyKey?: string
  ): HeadersInit {
    const h = new Headers(init.headers);
    h.set("Accept", "application/json");
    h.set("Content-Type", "application/json");

    const session = this.getCookie(SESSION_COOKIE_NAME, cookies);
    if (session) {
      h.set("Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(session)}`);
    }

    const csrf = this.getCookie(CSRF_COOKIE_NAME, cookies);
    if (csrf) {
      h.set("X-CSRF-Token", csrf);
    }

    if (!h.has("X-Request-Id")) {
      h.set("X-Request-Id", crypto.randomUUID());
    }

    if (idempotencyKey) {
      h.set("Idempotency-Key", idempotencyKey);
    }

    return h;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const body = await response.text();
    let data: any;
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || `HTTP_${response.status}`,
          message:
            data.error?.message ||
            data.message ||
            `Error ${response.status}: ${response.statusText}`,
          details: data.error?.details,
        },
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    } as ApiResponse<T>;
  }

  /* ─── GET ─────────────────────────────────────────────────────────────── */

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    cookies?: string
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.base}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers({}, cookies),
      cache: "no-store",
    });

    return this.handleResponse<T>(response);
  }

  /* ─── POST ────────────────────────────────────────────────────────────── */

  async post<T, Body = unknown>(
    path: string,
    body?: Body,
    options: {
      idempotencyKey?: string;
      cookies?: string;
    } = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: this.headers(
        { body: body ? JSON.stringify(body) : undefined },
        options.cookies,
        options.idempotencyKey
      ),
    });

    return this.handleResponse<T>(response);
  }

  /* ─── PATCH ───────────────────────────────────────────────────────────── */

  async patch<T, Body = unknown>(
    path: string,
    body?: Body,
    options: {
      idempotencyKey?: string;
      cookies?: string;
    } = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.base}${path}`, {
      method: "PATCH",
      headers: this.headers(
        { body: body ? JSON.stringify(body) : undefined },
        options.cookies,
        options.idempotencyKey
      ),
    });

    return this.handleResponse<T>(response);
  }

  /* ─── DELETE ──────────────────────────────────────────────────────────── */

  async delete(
    path: string,
    options: {
      idempotencyKey?: string;
      cookies?: string;
    } = {}
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.base}${path}`, {
      method: "DELETE",
      headers: this.headers({}, options.cookies, options.idempotencyKey),
    });

    return this.handleResponse<void>(response);
  }
}

/* ─── Instancia singleton ───────────────────────────────────────────────── */

export const apiClient = new ApiClient(API_ORIGIN);

/* ─── Helpers de sesión ─────────────────────────────────────────────────── */

export function getSessionCookie(cookies?: string): string | null {
  return apiClient["getCookie"](SESSION_COOKIE_NAME, cookies);
}

export function getCsrfToken(cookies?: string): string | null {
  return apiClient["getCookie"](CSRF_COOKIE_NAME, cookies);
}

/* ─── Tipo de SessionUser obtenido de la API ────────────────────────────── */

export interface SessionResponse {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "TECHNICIAN";
  avatar?: string | null;
  companies?: Array<{ id: string }>;
}

export function toSessionUser(data: SessionResponse): SessionUser {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    avatar: data.avatar,
    companies: data.companies,
  };
}
