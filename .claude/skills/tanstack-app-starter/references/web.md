# Web + server (`src`)

The UI is installed from the `@koderi` registry (`shared-ui`), so the shell, primitives, page
frames, charts and status all match Pylon. This repo adds the server and the routes around them.

## Structure

| File                       | Holds                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `routes/__root.tsx`        | Providers, `class="dark"`, the toaster, the document head                            |
| `routes/_app.tsx`          | The `AppShell` from the registry, with the app's nav, brand and `UserButton`         |
| `routes/login.tsx`         | Email/password sign-in and sign-up, outside the shell                                |
| `routes/api/auth/$`        | Better Auth's handler, mounted at `/api/auth/*`                                      |
| `routes/_app/`             | The pages: `index` (dashboard), `items` (list), `items/$itemId` (detail), `settings` |
| `server/api.ts`            | Named re-exports of every server function                                            |
| `server/handlers/items.ts` | The example CRUD: `createServerFn` + `authMiddleware` + zod + Kysely                 |
| `server/db.server.ts`      | `getDb()`: Postgres when `DATABASE_URL` is set, PGLite otherwise                     |
| `server/auth/`             | Better Auth server, the middleware, session verification, the PGLite dialect         |
| `ui/auth/`                 | The Better Auth client, `useCurrentUser`, the gates and `UserButton`                 |
| `migrations/`              | Numbered SQL, applied by `tooling/migrate.mjs` or at PGLite startup                  |

Imports from outside the feature use the `@/` alias; files in the same folder import each other
with `./`.

## Conventions

- Server functions return plain JSON (timestamps as ISO strings), never `Date` objects.
- Status text and colour come from the item's `status`; `ui/status-text.ts` maps the word to a
  tone. Do not derive status in a component.
- Grid children that hold wide content need `min-w-0`, or the page scrolls sideways.

## Checking

`npm run build` type-checks and builds, `npm test` runs the Vitest unit tests (including the
PGLite test), `npm run format` runs Prettier and `npm run lint` runs ESLint. A `.tsx` file
exports components only; logic lives in a `.ts` beside it, and that is the file the unit test
sits next to.
