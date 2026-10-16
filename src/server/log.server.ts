import { getRequest } from "@tanstack/react-start/server";
import { createLogger } from "../../tooling/log.mjs";

export const log = createLogger("starter");
export const apiLog = createLogger("starter:api");
export const authLog = createLogger("starter:auth");
export const dbLog = createLogger("starter:db");

/** `handler.export` for the current server fn; `meta` comes from the Start compiler. */
export function serverFnLabel(meta?: { name?: string; filename?: string }): string {
  if (meta?.name) {
    const file = meta.filename
      ?.split(/[\\/]/)
      .pop()
      ?.replace(/\.tsx?$/, "");
    return file ? `${file}.${meta.name}` : meta.name;
  }
  const request = getRequest();
  if (!request) return "server-fn";
  try {
    return `${request.method} ${new URL(request.url).pathname}`;
  } catch {
    return "server-fn";
  }
}

let bootLogged = false;

/** One-line summary when the server is ready (db + flags). */
export function logStartupBanner(extra?: Record<string, unknown>): void {
  if (bootLogged) return;
  bootLogged = true;
  log.info(
    {
      db: process.env.DATABASE_URL ? "postgres" : "pglite",
      auth: process.env.VITE_AUTH_ENABLED !== "false",
      ...extra,
    },
    "server ready",
  );
}
