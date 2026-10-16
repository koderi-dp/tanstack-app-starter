/**
 * Self-hosted Better Auth (server-only).
 *
 * Email/password at `/api/auth/*`; the session cookie stays on this origin.
 * Set `VITE_AUTH_ENABLED=false` to disable sign-in (dev user fallback when no
 * DATABASE_URL). Never import from client code — use `@/ui/auth/client`.
 */
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db.server";
import { summarizeInput } from "../error-boundary.server";
import { authLog } from "../log.server";
import { emailAndPasswordEnabled } from "./email-password";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const globalAuthRef = globalThis as typeof globalThis & {
  __authSecret__?: string;
};

function resolvedAuthSecret(): string {
  const fromEnv = env("BETTER_AUTH_SECRET");
  if (fromEnv) return fromEnv;
  if (globalAuthRef.__authSecret__) return globalAuthRef.__authSecret__;
  const dir = process.env.DATA_DIR || join(process.cwd(), "data");
  try {
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "auth.secret");
    if (existsSync(path)) {
      const existing = readFileSync(path, "utf8").trim();
      if (existing.length >= 32) {
        globalAuthRef.__authSecret__ = existing;
        return existing;
      }
    }
    const generated = randomBytes(32).toString("hex");
    writeFileSync(path, generated, { mode: 0o600 });
    globalAuthRef.__authSecret__ = generated;
    return generated;
  } catch {
    globalAuthRef.__authSecret__ ??= randomBytes(32).toString("hex");
    return globalAuthRef.__authSecret__;
  }
}

const authDisabled = env("VITE_AUTH_ENABLED") === "false";

/** True when email/password sign-in is enforced. */
export const authConfigured = !authDisabled && emailAndPasswordEnabled;

const explicitBaseURL = env("BETTER_AUTH_URL");
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://[::1]:3001",
];
const baseURL = explicitBaseURL ?? "http://localhost:3001";
const secureCookies = baseURL.startsWith("https://");
const cookiePrefix = secureCookies ? "__Host-starter-auth" : "starter-auth";

const trustedOrigins: string[] = explicitBaseURL
  ? [explicitBaseURL, ...LOCAL_DEV_ORIGINS]
  : LOCAL_DEV_ORIGINS;

const databaseUrl = env("DATABASE_URL");

function authPool(connectionString: string) {
  const pool = new Pool({ connectionString });
  pool.on("error", (err) => {
    authLog.error(
      { err: { name: err.name, message: err.message } },
      "auth postgres idle client error",
    );
  });
  return pool;
}

const database = databaseUrl
  ? authPool(databaseUrl)
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

function authLogArg(arg: unknown): unknown {
  if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack };
  return summarizeInput(arg);
}

export const SESSION_TOKEN_COOKIE = `${cookiePrefix}.session_token`;

export const auth = betterAuth({
  appName: "Starter",
  baseURL,
  secret: resolvedAuthSecret(),
  database,
  trustedOrigins,
  // Always consult the database so revoked sessions cannot survive in a cached cookie.
  session: { cookieCache: { enabled: false } },
  rateLimit: { enabled: true, storage: "memory" },
  logger: {
    level: "info",
    log: (level, message, ...args) => {
      const fields = args.length ? { args: args.map(authLogArg) } : {};
      if (level === "error") authLog.error(fields, message);
      else if (level === "warn") authLog.warn(fields, message);
      else if (level === "debug") authLog.debug(fields, message);
      else authLog.info(fields, message);
    },
  },
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),
  advanced: {
    disableCSRFCheck: false,
    disableOriginCheck: false,
    useSecureCookies: secureCookies,
    defaultCookieAttributes: { secure: secureCookies, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: `${cookiePrefix}.session_token` },
      session_data: { name: `${cookiePrefix}.session_data` },
      account_data: { name: `${cookiePrefix}.account_data` },
      dont_remember: { name: `${cookiePrefix}.dont_remember` },
    },
  },
  plugins: [tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
