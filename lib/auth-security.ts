const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/;
export function trustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = (process.env.APP_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (allowed.includes(origin)) return true;
  // Local development may use any loopback port; production must list its origins.
  return process.env.NODE_ENV === "development" && LOCAL_ORIGIN.test(origin);
}
export const SESSION_SECONDS = 60 * 60 * 24 * 5;
