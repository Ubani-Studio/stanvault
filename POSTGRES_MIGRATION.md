# Imprint Postgres migration

The Prisma datasource is now Postgres. Old SQLite dev data does not transfer.

## What changed

`prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

That single change is the entire schema-level move. Imprint did not use any SQLite-specific features, so no other model edits were needed.

## What you need to do

### 1. Provision a Postgres instance

Pick one. All work for Imprint:

| Provider | Notes |
| --- | --- |
| **Neon** | Free tier, serverless, branching. Recommended for staging |
| **Supabase** | Already used by Crucibla; convenient if consolidating |
| **Render** | Free tier, simple |
| **Local (Docker)** | `docker run -d --name imprint-pg -p 5432:5432 -e POSTGRES_PASSWORD=imprint -e POSTGRES_DB=imprint postgres:16` |

### 2. Update `.env`

Set `DATABASE_URL` to the Postgres connection string. Example:

```bash
# Local Docker
DATABASE_URL="postgresql://postgres:imprint@localhost:5432/imprint?schema=public"

# Neon
DATABASE_URL="postgresql://USER:PASSWORD@ep-XXX.eu-central-1.aws.neon.tech/imprint?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

### 3. Generate the initial Postgres migration

```bash
cd /home/sphinxy/stanvault
npx prisma migrate dev --name init
```

This creates `prisma/migrations/<timestamp>_init/migration.sql` with the full schema in Postgres syntax. It also runs the migration against your `DATABASE_URL`.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

Should already happen as part of `migrate dev`, but explicit just in case.

### 5. Seed (optional)

If you have a seed script (e.g. `prisma/seed.ts`):

```bash
npx prisma db seed
```

## What about the existing SQLite data?

It does not transfer automatically. If you need to keep dev data:

```bash
# 1. Export from SQLite (still works while .env points to SQLite)
sqlite3 prisma/dev.db .dump > sqlite-dump.sql

# 2. Hand-translate the INSERTs (SQLite syntax differs slightly from Postgres) and load into Postgres.
```

For most cases the better path is: switch to Postgres, re-seed, move on.

## Production deploy concerns (when ready)

- Use Postgres connection pooling (PgBouncer or Neon's built-in pooler) for serverless.
- Set `DATABASE_URL` AND `DIRECT_URL` (Prisma needs the latter for migrations against poolers).
- Run `npx prisma migrate deploy` (not `migrate dev`) in CI.
- Ensure SSL with `?sslmode=require` for managed providers.
