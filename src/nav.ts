import { Boxes, FolderTree, LayoutDashboard, Settings } from "lucide-react";
import type { Brand } from "@/ui/layout/app-shell";
import type { NavConfig } from "@/ui/layout/nav";

/** The app's own navigation. The shell and the command palette both read this. */
export const nav: NavConfig = {
  primary: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/items", label: "Items", icon: Boxes },
    { to: "/tree", label: "Tree", icon: FolderTree },
  ],
  secondary: [{ to: "/settings", label: "Settings", icon: Settings }],
};

export const brand: Brand = { name: "Starter", tagline: "TanStack", icon: Boxes };
