import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { signInDestination } from "./sign-in-destination";
import { authEnabled, signOut } from "@/ui/auth/client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { cn } from "@/ui/utils";

/** Render children only when a user is present (real session, or the disabled-auth dev user). */
export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

/** Render children only once we KNOW the visitor is signed out. */
export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

/** Client-side redirect to the sign-in route. */
export function RedirectToSignIn({ to = "/login" }: { to?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [target] = useState(() => ({ to, redirect: signInDestination(location.href) }));
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void navigate({ to: target.to, search: { redirect: target.redirect }, replace: true });
  }, [navigate, target]);
  return null;
}

/** Signed-in identity chip + sign-out, for the shell's header and sidebar footer. */
export function UserButton({ collapsed, footer }: { collapsed?: boolean; footer?: ReactNode }) {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  const email = user.primaryEmail;

  function handleSignOut() {
    setSigningOut(true);
    void signOut().catch(() => setSigningOut(false));
  }

  const avatar = user.profileImageUrl ? (
    <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
  ) : (
    <span className="grid size-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20">
      {label.charAt(0).toUpperCase()}
    </span>
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={label}
          >
            {avatar}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium text-foreground">{label}</span>
            {email && email !== label ? (
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            ) : null}
            {footer ? <span className="mt-1.5 block">{footer}</span> : null}
          </DropdownMenuLabel>
          {authEnabled ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={signingOut} onClick={handleSignOut}>
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {footer}
      </span>
      {authEnabled ? (
        <button
          type="button"
          disabled={signingOut}
          onClick={handleSignOut}
          className={cn(
            "shrink-0 cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline",
            "disabled:cursor-wait disabled:no-underline",
          )}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      ) : null}
    </div>
  );
}
