/** Where `RedirectToSignIn` sends signed-out visitors. */
export const SIGN_IN_PATH = "/login";

/**
 * Sanitize a `?redirect=` value: only same-origin absolute paths are allowed,
 * so a crafted link cannot bounce a signed-in user to another origin.
 */
export function signInDestination(redirect?: string): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/";
}
