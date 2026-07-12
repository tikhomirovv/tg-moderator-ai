# Database migrations

Schema changes are applied **only** via incremental Drizzle migrations. Data must not be lost in dev or production.

## After pull with schema changes

```bash
bun run db:migrate
```

`bun run dev` runs migrations automatically before starting Nuxt.

## Creating a migration

1. Change Drizzle schema under `server/database/schema/`.
2. `bun run db:generate` — new SQL file in `server/database/migrations/`.
3. Review generated SQL; add explicit data steps if needed (backfill, defaults, renames).
4. `bun run db:migrate` locally, then commit schema + migration files.

## Policy

**Forbidden** as a way to “update” a database:

- `DROP SCHEMA` / dropping and recreating `public`
- `TRUNCATE` or bulk delete to align with a new schema
- Rewriting `0000_init.sql` and expecting existing databases to re-apply it

**Allowed:**

- New files in `server/database/migrations/` (incremental only after initial deploy)
- Backward-compatible changes, or explicit data-migration steps inside migration SQL
- Fixing journal conflicts with a new migration — not by wiping the database
- **Baseline reset before first production:** rewriting `0000_init.sql` is allowed only with explicit `DROP SCHEMA public` + `db:migrate` on all environments (no prod yet)

Production containers run `db:migrate` on start (see `deploy/`); no destructive reset step.
