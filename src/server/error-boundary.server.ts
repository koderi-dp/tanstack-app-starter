import { randomBytes } from "node:crypto";
import type { Logger } from "pino";

export type ServerFnFailure = {
  fn: string;
  userId?: string;
  ms: number;
  data?: unknown;
  err: unknown;
};

type ErrorKind = "passthrough" | "unauthorized" | "expected" | "internal";

function isPassthrough(err: unknown): boolean {
  if (typeof Response !== "undefined" && err instanceof Response) return true;
  return Boolean(err && typeof err === "object" && ("isNotFound" in err || "isRedirect" in err));
}

function isDatabaseError(err: Error): boolean {
  const e = err as Error & { code?: unknown; severity?: unknown; routine?: unknown };
  return (
    typeof e.code === "string" &&
    /^[0-9A-Z]{5}$/.test(e.code) &&
    ("severity" in e || "routine" in e)
  );
}

export function classifyServerFnError(err: unknown): ErrorKind {
  if (isPassthrough(err)) return "passthrough";
  if (!(err instanceof Error)) return "internal";
  if (err.name === "UnauthorizedError" || err.name === "CrossSiteRequestError")
    return "unauthorized";
  if (err instanceof TypeError || err instanceof SyntaxError) return "internal";
  if (isDatabaseError(err)) return "internal";
  return "expected";
}

const SENSITIVE_KEY = /pass|secret|token|key|pem|cred|otp|code|cookie|auth|cert|cipher|recovery/i;
const MAX_DEPTH = 4;
const MAX_STRING = 200;
const MAX_ITEMS = 20;

/** Shape of server-fn input for logs: secrets redacted, long values clipped. */
export function summarizeInput(value: unknown, depth = 0, key = ""): unknown {
  if (key && SENSITIVE_KEY.test(key)) return value == null || value === "" ? value : "[redacted]";
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.includes("-----BEGIN")) return "[redacted]";
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…(${value.length})` : value;
  }
  if (typeof value !== "object") return typeof value;
  if (typeof FormData !== "undefined" && value instanceof FormData) return "[FormData]";
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? `[array(${value.length})]` : "[object]";
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((v) => summarizeInput(v, depth + 1));
    return value.length > MAX_ITEMS ? [...items, `…(${value.length})`] : items;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>))
    out[k] = summarizeInput(v, depth + 1, k);
  return out;
}

const PG_HEADLINES: Record<string, string> = {
  "23505": "That already exists",
  "23503": "A related item is missing or still in use",
  "23502": "A required value is missing",
  "23514": "A value is not allowed",
  "22001": "A value is too long",
  "22P02": "A value has the wrong format",
};

/**
 * Log a failed server fn and return the error the browser should receive.
 * Deliberate `throw new Error("…")` messages pass through; driver, system and
 * programming errors are masked behind a ref that appears in the log line.
 */
export function handleServerFnFailure(logger: Logger, failure: ServerFnFailure): unknown {
  const { fn, ms, err } = failure;
  const userId = failure.userId?.slice(0, 8);
  const kind = classifyServerFnError(err);

  if (kind === "passthrough") return err;

  if (kind === "unauthorized") {
    logger.info({ fn, userId, ms, err: (err as Error).message }, "<- denied");
    return err;
  }

  if (kind === "expected") {
    const e = err as Error & { code?: unknown };
    logger.warn(
      {
        fn,
        userId,
        ms,
        err: {
          name: e.name,
          message: e.message,
          ...(typeof e.code === "string" ? { code: e.code } : {}),
        },
        input: summarizeInput(failure.data),
      },
      `<- failed: ${e.message}`,
    );
    return err;
  }

  const ref = randomBytes(4).toString("hex");
  logger.error(
    {
      fn,
      userId,
      ms,
      ref,
      err:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : String(err),
      input: summarizeInput(failure.data),
    },
    `<- internal error ref=${ref}`,
  );
  const code =
    err instanceof Error && isDatabaseError(err)
      ? String((err as Error & { code?: unknown }).code)
      : "";
  const headline = PG_HEADLINES[code] ?? "Something went wrong";
  const detail =
    process.env.NODE_ENV === "production"
      ? ""
      : `: ${err instanceof Error ? err.message : String(err)}`;
  return new Error(`${headline}${detail} (ref ${ref})`);
}
