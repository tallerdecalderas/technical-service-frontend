import "server-only";

export function getAuthAPIURL(): string {
  const configuredURL = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredURL) {
    throw new Error("NEXT_PUBLIC_API_URL is required for authentication");
  }
  const parsedURL = new URL(configuredURL);
  if (
    (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") ||
    parsedURL.username ||
    parsedURL.password ||
    parsedURL.pathname !== "/" ||
    parsedURL.search ||
    parsedURL.hash
  ) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) API origin");
  }
  return parsedURL.origin;
}

export async function forwardAuthRequest(
  request: Request,
  endpoint: string,
  method: "GET" | "POST"
): Promise<Response> {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const origin = request.headers.get("origin");
  const csrfToken = request.headers.get("x-csrf-token");
  const requestId = request.headers.get("x-request-id");
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  if (origin) headers.set("origin", origin);
  if (csrfToken) headers.set("x-csrf-token", csrfToken);
  if (requestId) headers.set("x-request-id", requestId);

  const upstream = await fetch(
    `${getAuthAPIURL()}/api/v1/auth/${endpoint}`,
    {
      method,
      headers,
      body: method === "POST" ? await request.text() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    }
  );
  const responseHeaders = new Headers({
    "cache-control": "no-store",
    "content-type":
      upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
  });
  for (const cookieHeader of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookieHeader);
  }
  const requestIdHeader = upstream.headers.get("x-request-id");
  if (requestIdHeader) responseHeaders.set("x-request-id", requestIdHeader);
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
