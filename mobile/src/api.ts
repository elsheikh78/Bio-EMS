import { safeOverview } from "./model";
// Fixed HTTPS origin: credentials cannot be redirected to an arbitrary server.
export const COMPANY_ORIGIN = "https://bioems-company.bioems-egypt.workers.dev";
export class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}
async function request(
  path: "login" | "overview" | "logout",
  token: string | null,
  body?: unknown,
  signal?: AbortSignal,
) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel);
  const timeout = setTimeout(cancel, 15000);
  try {
    const response = await fetch(
      `${COMPANY_ORIGIN}/api/mobile/viewer/${path}`,
      {
        method: path === "overview" ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        credentials: "omit",
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new ApiError(response.status);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
export async function login(username: string, password: string) {
  const value = await request("login", null, { username, password });
  if (
    typeof value.token !== "string" ||
    !/^mobile\.[A-Za-z0-9+/=]{44}$/.test(value.token) ||
    !Number.isFinite(value.expiresAt)
  )
    throw Error("Invalid session");
  return { token: value.token as string, expiresAt: value.expiresAt as number };
}
export async function overview(token: string, signal: AbortSignal) {
  return safeOverview(await request("overview", token, undefined, signal));
}
export async function logout(token: string) {
  await request("logout", token, {});
}
