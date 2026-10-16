import { Link } from "@tanstack/react-router";

export function AppErrorComponent({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="grid max-w-md gap-3 text-center">
        <h1 className="text-lg font-medium">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link to="/" className="text-sm underline">
          Back home
        </Link>
      </div>
    </div>
  );
}

export function AppNotFoundComponent() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="grid max-w-md gap-3 text-center">
        <h1 className="text-lg font-medium">Not found</h1>
        <p className="text-sm text-muted-foreground">That page does not exist.</p>
        <Link to="/" className="text-sm underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
