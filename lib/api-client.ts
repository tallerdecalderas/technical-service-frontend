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

/** Timeout por defecto para peticiones estándar JSON (15 segundos) */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Timeout extendido para subidas de archivos o FormData (60 segundos) */
export const UPLOAD_TIMEOUT_MS = 60_000;

/* ─── Tipos de transporte ───────────────────────────────────────────────── */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  version?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

export function unwrapData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || "API request failed");
  }
  if (response.data === undefined) {
    throw new Error("Missing data in API response");
  }
  return response.data;
}

export function unwrapList<T>(
  response: ApiResponse<T[]>,
): { data: T[]; meta: PaginationMeta } {
  if (!response.success) {
    throw new Error(response.error?.message || "API request failed");
  }
  if (response.data === undefined) {
    throw new Error("Missing data in API response");
  }
  if (!response.meta) {
    throw new Error("Missing meta in API response");
  }
  return { data: response.data, meta: response.meta };
}

export interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  cookies?: string;
  idempotencyKey?: string;
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
    idempotencyKey?: string,
    contentType: string = "application/json"
  ): HeadersInit {
    const h = new Headers(init.headers);
    h.set("Accept", "application/json");
    if (contentType) {
      h.set("Content-Type", contentType);
    }

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

    const meta = data.meta
      ? {
          ...data.meta,
          totalPages:
            data.meta.totalPages ??
            Math.ceil(data.meta.total / Math.max(data.meta.pageSize, 1)),
        }
      : undefined;

    return {
      success: true,
      data: data.data,
      meta,
      message: data.message,
    } as ApiResponse<T>;
  }

  /**
   * Ejecuta una petición fetch con control de timeout y manejo seguro de errores de red.
   */
  private async executeFetch<T>(
    url: string,
    init: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    externalSignal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    let isTimedOut = false;

    const timer = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    try {
      const response = await fetch(url, {
        ...init,
        credentials: "include",
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (err: any) {
      if (isTimedOut || err?.name === "TimeoutError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: `La solicitud tardó más de ${Math.round(
              timeoutMs / 1000
            )}s y fue cancelada. Comprueba tu conexión a internet.`,
          },
        };
      }

      if (err?.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "ABORTED",
            message: "La solicitud fue cancelada.",
          },
        };
      }

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            err?.message ||
            "Error de conexión: no se pudo comunicar con el servidor.",
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /* ─── GET ─────────────────────────────────────────────────────────────── */

  async get<T>(
    path: string,
    paramsOrCookies?: Record<string, string | number | boolean | undefined | null> | string,
    cookiesOrOptions?: string | RequestOptions,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    let params: Record<string, string | number | boolean | undefined | null> | undefined;
    let cookies: string | undefined;
    let timeoutMs: number | undefined;
    let signal: AbortSignal | undefined;

    if (typeof paramsOrCookies === "string") {
      cookies = paramsOrCookies;
      if (typeof cookiesOrOptions === "object" && cookiesOrOptions !== null) {
        timeoutMs = cookiesOrOptions.timeoutMs;
        signal = cookiesOrOptions.signal;
      }
      if (options) {
        timeoutMs = options.timeoutMs ?? timeoutMs;
        signal = options.signal ?? signal;
      }
    } else {
      params = paramsOrCookies;
      if (typeof cookiesOrOptions === "string") {
        cookies = cookiesOrOptions;
      } else if (typeof cookiesOrOptions === "object" && cookiesOrOptions !== null) {
        timeoutMs = cookiesOrOptions.timeoutMs;
        signal = cookiesOrOptions.signal;
      }
      if (options) {
        timeoutMs = options.timeoutMs ?? timeoutMs;
        signal = options.signal ?? signal;
      }
    }

    const url = new URL(`${this.base}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return this.executeFetch<T>(
      url.toString(),
      {
        method: "GET",
        headers: this.headers({}, cookies),
        cache: "no-store",
      },
      timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal
    );
  }

  /* ─── POST ────────────────────────────────────────────────────────────── */

  async post<T, Body = unknown>(
    path: string,
    body?: Body,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const effectiveTimeout =
      options.timeoutMs ?? (isFormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

    const payload: BodyInit | undefined = isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined;

    return this.executeFetch<T>(
      `${this.base}${path}`,
      {
        method: "POST",
        headers: this.headers(
          {},
          options.cookies,
          options.idempotencyKey,
          isFormData ? undefined : "application/json"
        ),
        body: payload,
      },
      effectiveTimeout,
      options.signal
    );
  }

  /* ─── PATCH ───────────────────────────────────────────────────────────── */

  async patch<T, Body = unknown>(
    path: string,
    body?: Body,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const payload: BodyInit | undefined = isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined;

    return this.executeFetch<T>(
      `${this.base}${path}`,
      {
        method: "PATCH",
        headers: this.headers(
          {},
          options.cookies,
          options.idempotencyKey,
          isFormData ? undefined : "application/json"
        ),
        body: payload,
      },
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      options.signal
    );
  }

  /* ─── DELETE ──────────────────────────────────────────────────────────── */

  async delete<T = void>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeFetch<T>(
      `${this.base}${path}`,
      {
        method: "DELETE",
        headers: this.headers({}, options.cookies, options.idempotencyKey),
      },
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      options.signal
    );
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
