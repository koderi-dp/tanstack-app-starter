import { Boxes } from "lucide-react";

/** The app's wordmark, used on the login page. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-secondary text-muted-foreground shadow-[var(--shadow-border)]">
        <Boxes className="size-4" />
      </span>
      <span className="grid leading-tight">
        <span className="text-sm font-semibold tracking-tight">Starter</span>
        <span className="text-[11px] text-muted-foreground">TanStack</span>
      </span>
    </span>
  );
}
