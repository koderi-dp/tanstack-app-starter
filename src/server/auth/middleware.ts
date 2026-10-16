import { createMiddleware } from "@tanstack/react-start";

/**
 * Auth middleware for server functions — verified user id from the session cookie.
 *
 *   export const listItems = createServerFn({ method: "GET" })
 *     .middleware([authMiddleware])
 *     .handler(async ({ context }) => {
 *       return db.selectFrom("items").where("user_id", "=", context.userId).execute();
 *     });
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, data, serverFnMeta }) => {
    const { apiLog, serverFnLabel } = await import("../log.server");
    const fn = serverFnLabel(serverFnMeta);
    const start = Date.now();
    let userId: string | undefined;
    try {
      const { assertSameSiteRequest } = await import("./isolation.server");
      const { authConfigured, DEV_USER_ID, getSessionUser, requireUserId } =
        await import("./verify.server");
      assertSameSiteRequest();
      const session = authConfigured ? await getSessionUser() : null;
      if (authConfigured && !session) {
        const { UnauthorizedError } = await import("./verify.server");
        throw new UnauthorizedError();
      }
      userId = session?.id ?? (await requireUserId());
      apiLog.debug({ fn, userId: userId.slice(0, 8) }, "->");
      const result = await next({
        context: { userId, authSessionId: session?.sessionId ?? `dev:${DEV_USER_ID}` },
      });
      apiLog.debug({ fn, userId: userId.slice(0, 8), ms: Date.now() - start }, "<- ok");
      return result;
    } catch (err) {
      const { handleServerFnFailure } = await import("../error-boundary.server");
      throw handleServerFnFailure(apiLog, { fn, userId, ms: Date.now() - start, data, err });
    }
  },
);

/**
 * Middleware for server functions that need no sign-in (health, public reads).
 * Logs and applies the same error boundary, but sets no user on the context.
 */
export const publicMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, data, serverFnMeta }) => {
    const { apiLog, serverFnLabel } = await import("../log.server");
    const fn = serverFnLabel(serverFnMeta);
    const start = Date.now();
    try {
      apiLog.debug({ fn }, "->");
      const result = await next({ context: {} });
      apiLog.debug({ fn, ms: Date.now() - start }, "<- ok");
      return result;
    } catch (err) {
      const { handleServerFnFailure } = await import("../error-boundary.server");
      throw handleServerFnFailure(apiLog, { fn, ms: Date.now() - start, data, err });
    }
  },
);
