import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/ui/auth/provider";
import { AppNotFoundComponent } from "@/ui/error-component";
import { QueryProvider } from "@/ui/query";
import { AppToaster } from "@/ui/toaster";
import appCss from "../styles.css?url";

const APP_NAME = "Starter";

export const Route = createRootRoute({
  notFoundComponent: AppNotFoundComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0a0b0d" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <QueryProvider>
            <Outlet />
            <AppToaster />
          </QueryProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
