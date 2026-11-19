"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "tech-service-session";
const CSRF_COOKIE_NAME = "tech-service-csrf";

/** Extrae las cookies de sesión y CSRF del navegador (servidor) para enviarlas al backend Go. */
export async function getServerCookies(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";
  const csrf = cookieStore.get(CSRF_COOKIE_NAME)?.value ?? "";
  return [
    session ? `${SESSION_COOKIE_NAME}=${session}` : "",
    csrf ? `${CSRF_COOKIE_NAME}=${csrf}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}
