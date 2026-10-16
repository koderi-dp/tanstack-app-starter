import { LogIn } from "lucide-react";
import { createFileRoute, Navigate, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled } from "@/ui/auth/client";
import { signInDestination } from "@/ui/auth/sign-in-destination";
import { useCurrentUserState } from "@/ui/auth/use-current-user";
import { Wordmark } from "@/ui/wordmark";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? signInDestination(s.redirect) : undefined,
  }),
});

function Login() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const destination = signInDestination(redirect);
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) return <Navigate to={destination} />;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        </div>
        {authEnabled ? (
          <>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                setBusy(true);
                void (async () => {
                  try {
                    if (mode === "up") {
                      const { error: err } = await authClient.signUp.email({
                        email,
                        password,
                        name: name || email,
                      });
                      if (err) throw new Error(err.message);
                    } else {
                      const { error: err } = await authClient.signIn.email({ email, password });
                      if (err) throw new Error(err.message);
                    }
                    await authClient.getSession();
                    await navigate({ to: destination });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Sign-in failed");
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              {mode === "up" ? (
                <label className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
              ) : null}
              <label className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </label>
              {error ? <p className="text-sm text-danger-fg">{error}</p> : null}
              <Button icon={LogIn} type="submit" disabled={busy} className="w-full">
                {mode === "up" ? "Create account" : "Sign in"}
              </Button>
            </form>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
