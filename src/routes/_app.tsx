import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/ui/layout/app-shell";
import { RedirectToSignIn, UserButton } from "@/ui/auth/gates";
import { useCurrentUserState } from "@/ui/auth/use-current-user";
import { brand, nav } from "@/nav";

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  // Wait out the session before deciding, then send signed-out visitors to /login.
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return (
    <AppShell
      nav={nav}
      brand={brand}
      headerEnd={<UserButton collapsed />}
      // The detail page scrolls its own panes, so it gets a fixed-height main.
      fullHeight={(pathname) => pathname.startsWith("/items/")}
    />
  );
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
