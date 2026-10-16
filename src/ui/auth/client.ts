import { createAuthClient } from "better-auth/react";

/** Better Auth client — same-origin `/api/auth/*`, cookie session. */
export const authClient = createAuthClient();

/** True when sign-in is required (`VITE_AUTH_ENABLED` is not `"false"`). */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

/** Sign out and redirect. */
export async function signOut(redirectTo = "/login"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "Sign-out failed");
  window.location.href = redirectTo;
}
