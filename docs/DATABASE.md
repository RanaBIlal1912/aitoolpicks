# Database foundation (platform upgrade, phase 3)

**Status: foundation only.** The schema, migrations, environment validation, health checks and tests exist. **Nothing on the public website reads or writes the database yet**, and the site is still the static export on GitHub Pages. Design: [docs/platform/](platform/README.md). A test (`tests/server-boundary.test.ts`) fails if a page or component imports the server code, and checks the built site contains no database setting.

## What is where

| Path | Purpose |
| --- | --- |
| `src/server/env.ts` | Zod-validated environment. Pure `parseEnv()` for tests, `getEnv()` for code. Names every bad variable, never prints a value. |
| `src/server/db/schema/*.ts` | The Drizzle schema: 39 tables and 25 enums, one file per area. |
| `drizzle/0000_initial_schema.sql` | Generated tables, constraints and indexes. |
| `drizzle/0001_rules_triggers_rls.sql` | Written by hand: housekeeping triggers, content rules, append-only audit log, roles, grants, Row Level Security. |
| `src/server/db/client.ts` | postgres.js client: one connection, prepared statements off (required by Supabase's transaction pooler), TLS on for any host that is not local. |
| `src/server/db/server.ts` | The only entry meant for Next.js code. It starts with `import "server-only"`, so a Client Component importing it fails the build. |
| `src/server/db/health.ts` | Health checks. `scripts/db/health.ts` prints them. |
| `src/server/db/migrations.ts`, `scripts/db/migrate.ts` | Applying migrations. |
| `tests/db-*.test.ts`, `tests/server-*.test.ts` | The tests (see below). |

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:generate` | After changing the schema: writes the next migration into `drizzle/`. Needs no database. |
| `npm run db:check` | Verifies the migration history is consistent. |
| `npm run db:migrate` | Applies pending migrations to the database in `DATABASE_DIRECT_URL` (or `DATABASE_URL`). A database that is not on this computer needs `--confirm=<host>`. Safe to run twice. |
| `npm run db:health` | Prints connection, migrations, tables, Row Level Security and public-role checks. `--json` for JSON. Exit code 0 only when everything is ok. |
| `npm test` | Runs everything, including the database tests. |
| `SKIP_DB_TESTS=1 npm test` | Skips starting the test database. |

Settings go in `.env.local` (git-ignored); the names are in `.env.example`. `DATABASE_URL` is the only one phase 3 needs.

## The test database

`npm test` starts a **disposable** PostgreSQL server (new data folder in the system temp directory, free port on 127.0.0.1, trust authentication, deleted afterwards), applies the migrations to a template database once, and gives every test file its own copy. It looks for the server programs in `PG_BIN_DIR`, then on `PATH`, then in the usual install folders. It never touches another PostgreSQL installation. If none is found, the database tests are skipped and say why; they do not fail. About 4 seconds are added to a test run for start-up.

What the tests prove, each with a case that **must be refused**: every rule listed in `docs/platform/02-database.md` section 6 (hands-on reviews need a complete testing record, documentation reviews never have one, testing dates are real and not in the future, evidence addresses are https, an affiliate link needs an approved programme, the audit log cannot be changed even by a superuser, the last active owner cannot be removed, a sensitive change needs a second approver, one primary category per tool, two category levels, unique slugs and names, https addresses everywhere, submission duplicates per website) and that `anon` and `authenticated` cannot touch any table or function. To check the tests are not vacuous, three of the rules were removed in a scratch database and the forbidden statement was then accepted.

## Rules for adding to the schema

1. Change `src/server/db/schema/`, run `npm run db:generate`, review the SQL. Never edit a migration that has been applied anywhere.
2. Anything a table definition cannot express (a trigger, a policy, a grant) goes in a new custom migration (`npx drizzle-kit generate --custom --name=...`).
3. Every new table needs, in its migration: `ENABLE ROW LEVEL SECURITY`, a policy for the `app` role, and a `GRANT` to `app`. `tests/db-migrations.db.test.ts` and `npm run db:health` fail if one is missing.
4. Statements in a custom migration are separated by `--> statement-breakpoint`.
5. Migrations only move forward. To undo one, write a new migration, or restore a backup (see `docs/platform/04-migration-and-hosting.md`).

## Roles and hosted databases

The migration creates three login-less roles if they do not exist: `anon` and `authenticated` (Supabase's browser-facing API roles, which get **no** privilege on anything) and `app`. The server must connect as `app`. A database administrator gives it `LOGIN` and a password outside the repository (`ALTER ROLE app LOGIN PASSWORD '...'`); a password never goes into a migration. On Supabase use the transaction pooler (port 6543) for `DATABASE_URL` and the session pooler (port 5432, IPv4) for `DATABASE_DIRECT_URL`. The direct connection is IPv6 only on the Free and Pro plans.

## Windows note: long folder paths

`drizzle-kit` runs `esbuild`. If the project sits in a folder whose full path is so long that `node_modules/drizzle-kit/node_modules/@esbuild/win32-x64/esbuild.exe` exceeds 260 characters, Windows cannot start it ("spawn ... ENOENT"), and npm's install script for esbuild fails the same way. Either keep the project in a shorter folder, or install with `npm install --ignore-scripts` and point `ESBUILD_BINARY_PATH` at a copy of `esbuild.exe` kept at a short path. The database tests and the health check do not use esbuild and are not affected. Node 22.18 or newer is needed for the command line scripts (they run TypeScript directly).

## Not in this phase

Data import (phase 4), login and roles seeding (phase 5), the admin dashboard (phase 6), analytics collection (phase 7), health and deploy routes, and anything on Vercel (phase 8). The `/api/health` routes cannot exist yet because Route Handlers that read the request are not supported by a static export.

## Data import (phase 4): catalogue

The catalogue in `content/` (tools, categories, affiliate programmes) can be imported into the database. The files are only read; the website still builds from them.

| Command | What it does |
| --- | --- |
| `npm run migrate:backup` | Copies `content/` and `src/data/*.ts` to `backups/<timestamp>/` (git-ignored) with a SHA-256 manifest, and re-hashes each copy. Run before every import. |
| `npm run migrate:catalogue -- --dry-run` | Runs the whole import inside a transaction and rolls it back; prints what would be inserted, updated or left alone. |
| `npm run migrate:catalogue` | Imports, then verifies. A database that is not on this computer needs `--confirm=<host>`. |
| `npm run migrate:catalogue -- --verify --report` | Verifies only and writes `reports/migration-verification.json` and `.md`. |

How it behaves:

- **Repeatable.** Rows are matched by slug. A tool is rewritten only if its exported form differs from its file, so a second run changes nothing (`unchanged` counts).
- **Atomic.** One transaction; any error leaves the database as it was.
- **Non-destructive.** Nothing is deleted. Rows that are in the database but not in the files are listed as "kept".
- **Strict.** The files are validated with Zod first; an unknown field or a broken cross reference stops the import before the database is touched.
- **Verified by round trip.** The database is exported back to the original JSON shape and compared with the files field by field: all 69 tools, 15 categories with 36 subcategories, 15 affiliate programmes. Also checked: counts equal the files (and the Phase 1 audit), relationships, tool slugs equal the file ids, no affiliate link exists and nothing is approved.
- **Affiliate safety.** The importer never writes `affiliate_links`. A programme keeps the status in `affiliate.json`.

Imported tools are `published`, dated by their `added` field. Companies are the `vendor` of each tool. Not imported yet (later steps): reviews (the `review` field on 5 tools is left out of the comparison), articles, comparisons, news, roundups, models, media, redirects.

The migration `0002` adds `tools.catalog_verified_on` (the `verified` date shown in listings differs from `verification.checked` for 6 tools), `tool_sources.position` (one tool cites the same address twice) and `tool_categories.position` (21 tools list categories in a different order than the categories file).
