import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthAPIURL } from "@/lib/auth-api"

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tech-service-session"
const CSRF_COOKIE = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "tech-service-csrf"

interface SessionCheck {
  role: string | null;
  status: number;
}

async function getSession(
  request: NextRequest,
  csrfToken?: string
): Promise<SessionCheck> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)
  if (!sessionCookie?.value) return { role: null, status: 401 }

  try {
    const cookieParts = [`${SESSION_COOKIE}=${encodeURIComponent(sessionCookie.value)}`]
    const csrfCookie = request.cookies.get(CSRF_COOKIE)
    if (csrfCookie?.value) {
      cookieParts.push(`${CSRF_COOKIE}=${encodeURIComponent(csrfCookie.value)}`)
    }
    const headers = new Headers({ cookie: cookieParts.join("; ") })
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken)
    const response = await fetch(`${getAuthAPIURL()}/api/v1/auth/session`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return { role: null, status: response.status }
    const result = (await response.json()) as {
      success?: boolean
      data?: { role?: string }
    }
    if (
      !result.success ||
      (result.data?.role !== "ADMIN" && result.data?.role !== "TECHNICIAN")
    ) {
      return { role: null, status: 502 }
    }
    return { role: result.data.role, status: response.status }
  } catch {
    console.error("Could not validate the application session with the Go API")
    return { role: null, status: 503 }
  }
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE)
  response.cookies.delete(CSRF_COOKIE)
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === "/forgot-password" || pathname === "/reset-password") {
    return NextResponse.next()
  }
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  if (pathname.startsWith("/api/")) {
    if (isMutation) {
      if (request.headers.get("origin") !== request.nextUrl.origin) {
        return NextResponse.json(
          { success: false, error: "Origen no permitido." },
          { status: 403 }
        )
      }
      const csrfCookie = request.cookies.get(CSRF_COOKIE)
      if (!csrfCookie?.value) {
        return NextResponse.json(
          { success: false, error: "Token CSRF inválido." },
          { status: 403 }
        )
      }
      const sessionCheck = await getSession(request, csrfCookie.value)
      if (sessionCheck.status === 401) {
        return NextResponse.json(
          { success: false, error: "No autenticado." },
          { status: 401 }
        )
      }
      if (sessionCheck.status === 403) {
        return NextResponse.json(
          { success: false, error: "Token CSRF inválido." },
          { status: 403 }
        )
      }
      if (sessionCheck.status !== 200 || !sessionCheck.role) {
        return NextResponse.json(
          { success: false, error: "El servicio de autenticación no está disponible." },
          { status: 503 }
        )
      }
      return NextResponse.next()
    }
    const sessionCheck = await getSession(request)
    if (sessionCheck.status !== 200 || !sessionCheck.role) {
      return NextResponse.json(
        { success: false, error: sessionCheck.status === 401 ? "No autenticado." : "El servicio de autenticación no está disponible." },
        { status: sessionCheck.status === 401 ? 401 : 503 }
      )
    }
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)
  const sessionCheck = await getSession(request)
  const session = sessionCheck.role ? { role: sessionCheck.role } : null

  if (pathname === "/login") {
    if (session) {
      const redirectUrl = session.role === "ADMIN" ? "/admin/dashboard" : "/technician/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    const response = NextResponse.next()
    return sessionCookie?.value && sessionCheck.status === 401
      ? clearAuthCookies(response)
      : response
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    return sessionCookie?.value && sessionCheck.status === 401
      ? clearAuthCookies(response)
      : response
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/technician/dashboard", request.url))
  }
  if (pathname.startsWith("/technician") && session.role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes that don't need auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
}
