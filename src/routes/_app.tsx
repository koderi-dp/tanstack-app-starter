import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/ui/layout/app-shell";
import { UserButton } from "@/ui/auth/gates";
import { brand, nav } from "@/nav";

function AppLayout() {
  return (
    <AppShell
      nav={nav}
      brand={brand}
      headerEnd={<UserButton collapsed />}
      sidebarFooter={(collapsed) => <UserButton collapsed={collapsed} />}
      // The detail page scrolls its own panes, so it gets a fixed-height main.
      fullHeight={(pathname) => pathname.startsWith("/items/")}
    />
  );
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
