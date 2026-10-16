# tanstack-app-starter

A full-stack TanStack Start starter that looks and works like Pylon. The UI is installed from the
`@koderi` shadcn registry (`shared-ui`); this repo is the server around it.

```sh
npm install
npm run dev     # PGLite starts and migrations run with no DATABASE_URL
npm run build
npm test
```

Set `DATABASE_URL` to use Postgres instead of the embedded PGLite. `docker compose up --build`
runs the app against a Postgres container.

See `CLAUDE.md` for the layout and the rules.
