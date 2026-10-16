# tanstack-app-starter

A full-stack TanStack Start starter that looks and works like Pylon. The UI comes from the
`@koderi` shadcn registry (`shared-ui`); this repo owns the server around it: server functions,
Kysely/PGLite, Better Auth, pino and Docker.

## Commands

- `npm run dev` — TanStack Start dev server. With no `DATABASE_URL`, PGLite starts and the
  migrations run automatically.
- `npm run build` — type-check and build (Nitro, `node-server` preset).
- `npm run start` — run the built server (`.output/server/index.mjs`).
- `npm run db:migrate` — apply `migrations/*.sql` to `DATABASE_URL` (skips without one).
- `npm test` — Vitest, node environment, `*.test.ts` beside the file it tests.
- `npm run lint` — ESLint, zero warnings.
- `npm run format` / `npm run format:check` — Prettier.

## Layout

- `src/routes/` — file routes. `__root.tsx` (providers, `class="dark"`), the pathless `_app.tsx`
  (the app shell), pages under `_app/`, and `login.tsx` outside the shell.
- `src/server/` — server functions (`handlers/*.ts`, re-exported from `api.ts`), the DB
  (`db.server.ts`, `db.schema.ts`), auth (`auth/`), logging (`log.server.ts`) and the error
  boundary (`error-boundary.server.ts`).
- `src/ui/` — installed from the registry. Do not edit by hand; update it with
  `npx shadcn add @koderi/<item> --overwrite`.
- `migrations/` — numbered SQL, applied by `tooling/migrate.mjs` (Postgres) or at startup (PGLite).
- `tooling/` — the migrator, the migration bookkeeping and the pino logger.

## Rules

- `src/ui` never imports `*.server.ts`. Server-only modules keep the `.server.ts` suffix so Vite
  never ships them to the browser.
- A `.tsx` file exports only components. Logic lives in a `.ts` with its test beside it.
- Server functions use `authMiddleware` (or `publicMiddleware` for unauthenticated reads) and a
  zod `validator`; the error boundary turns failures into a logged, masked response.
- Per-user tables carry a `user_id TEXT NOT NULL` column and every query is scoped to
  `context.userId`.

## Removing auth or logging

- **Auth** lives in `src/server/auth/` and `src/ui/auth/`. To remove it: delete both folders,
  drop `authMiddleware` from the handlers (or replace with `publicMiddleware`), remove the
  `api/auth/$` route and the `login.tsx` route, and delete `migrations/0001_auth.sql`.
- **Logging** is `tooling/log.mjs` + `src/server/log.server.ts`. To remove it, replace the
  `createLogger` calls with `console` and drop `pino`/`pino-pretty`.

## Checking

`npm run build`, `npm test` and `npm run lint` (zero warnings), plus `npm run format:check`.
