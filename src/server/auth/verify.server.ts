import { getRequest } from "@tanstack/react-start/server";
import { auth, authConfigured } from "./server";
import { authLog } from "@/server/log.server";

/**
 * Server-side session resolution (server-only).
 *
 * Session cookie is sent with every request; resolve the user via
 * `auth.api.getSession`. Never trust a client-supplied user id.
 */

/** True when a real database is configured server-side. */
const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

/** Re-export so callers can branch on it without importing `server.ts`. */
export { authConfigured };

if (databaseConfigured && !authConfigured) {
  authLog.error(
    "DATABASE_URL is set but auth is disabled (VITE_AUTH_ENABLED=false) — requireUserId() will reject every request (fail closed)",
  );
}

/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */
export const DEV_USER_ID = "dev-user";

/** Thrown by `requireUserId` when the caller has no valid session. */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = { id: string; email: string | null; sessionId: string };

/** Resolve the signed-in user from the current request, or `null` when unsigned. */
export async function getSessionUser(): Promise<VerifiedUser | null> {
  if (!authConfigured) return null;
  const request = getRequest();
  if (!request) return null;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? null, sessionId: session.session.id };
}

/**
 * Resolve the current user id for a server function, or throw when unauthorized.
 * Prefer `authMiddleware`, which calls this for you.
 */
export async function requireUserId(): Promise<string> {
  if (!authConfigured) {
    if (databaseConfigured) {
      throw new Error(
        "Auth is disabled (VITE_AUTH_ENABLED=false) but DATABASE_URL is set — " +
          "refusing to fall back to the shared dev user against a real database.",
      );
    }
    return DEV_USER_ID;
  }
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}
