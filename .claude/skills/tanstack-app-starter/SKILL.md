---
name: tanstack-app-starter
description: How to change and verify the tanstack-app-starter full-stack app (TanStack Start + Nitro, Kysely/PGLite, Better Auth, pino, UI from the @koderi shadcn registry). Use for work on server functions, the database, auth, or pulling a UI update from the registry.
---

# Working on tanstack-app-starter

`CLAUDE.md` has the commands and the layout. This skill is the working knowledge on top of it.

## Where a change goes

| The request is about         | Start in                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------- |
| A server function or a route | `src/server/handlers/` and `src/routes/`                                     |
| The database schema          | `src/server/db.schema.ts` + a new `migrations/00NN_*.sql`                    |
| Auth                         | `src/server/auth/` (server) and `src/ui/auth/` (client)                      |
| A page, a dialog             | `src/routes/_app/`                                                           |
| A UI component               | `shared-ui` (the registry), then `npx shadcn add @koderi/<item> --overwrite` |

## Rules

- The UI in `src/ui/` is generated. Change it in `shared-ui`, rebuild the registry, and pull it
  here with `--overwrite`; do not edit the files in place.
- `src/ui` never imports `*.server.ts`. Server-only modules keep the `.server.ts` suffix.
- A `.tsx` file exports only components. Logic lives in a `.ts` with its test beside it.
- Server functions use `authMiddleware` and a zod `validator`; per-user queries are scoped to
  `context.userId`.

## Checking

`npm run build`, `npm test`, `npm run lint` (zero warnings), `npm run format:check`. The PGLite
fallback is exercised by `npm run dev` with no `DATABASE_URL`; the Postgres path by
`docker compose up --build`.

## References

- [references/web.md](references/web.md): the route structure and the conventions it follows.
