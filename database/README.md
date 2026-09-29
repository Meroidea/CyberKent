# CyberKent database

| File | What it is |
|---|---|
| `cyberkent_database.sql` | Full `pg_dump` (PostgreSQL 17, as production) of a database built from every Prisma migration and the reference seed: schema, constraints, indexes and synthetic seed data. Password hashes are redacted. Re-exported 28 September 2026, after the `admin_panel` migration of 25 September. |
| `erd/erd-0-overview.mmd` | Every table and every foreign key, without columns. |
| `erd/erd-1-identity.png` … `erd-5-console-admin.png` | Logical ERDs by domain (crow's-foot notation): identity, analysis and AI, reports, community, and the Council console (tasks, site notices, article authoring). |
| `erd/*.mmd` | The Mermaid source of each ERD. |
| `erd/generate_erd.py` | Regenerates every `.mmd` from `backend/prisma/schema.prisma`. |
| `erd/erd-prisma-studio-visualizer.png` | Physical ERD drawn by Prisma Studio's Visualizer on 10 September. It predates the `admin_panel` migration, so it lacks Task, TaskComment and SiteNotice; the generated ERDs above are current. |

The source of truth is `backend/prisma/schema.prisma` and `backend/prisma/migrations/`.
Schema changes are made only through Prisma migrations (Rule 5.4).

## Where the database runs

Production is on **Supabase** (PostgreSQL 17, `ap-northeast-1`), in a
dedicated `cyberkent` schema with its own `cyberkent_app` login. The
serverless API connects through Supabase's transaction pooler (port 6543).
Development and tests use any PostgreSQL 15+ database. The project moved off
Neon in September 2026; earlier documents that mention Neon describe that
first setup.

## Restore

```bash
createdb cyberkent
psql cyberkent -f cyberkent_database.sql
```

Or recreate from migrations and seed:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Refresh these files after a migration

```bash
python3 database/erd/generate_erd.py                  # Mermaid sources
npx -y @mermaid-js/mermaid-cli -i database/erd/erd-5-console-admin.mmd \
  -o database/erd/erd-5-console-admin.png -b white -s 2   # one PNG per .mmd
```

For the SQL, build a fresh database with `prisma migrate deploy` and
`prisma db seed`, dump it with
`pg_dump --no-owner --no-privileges --column-inserts --quote-all-identifiers`,
and replace the bcrypt digests with the redaction placeholder before
committing. Never dump production: it holds real residents' data.

## At a glance

- 29 domain tables, 17 enumerated types, 42 foreign keys, 96 indexes, 11 CHECK constraints
- Third normal form; every relationship enforced by a foreign key
- Soft deletion (`deletedAt`) on records with audit or evidentiary weight
- `retentionUntil` on every table holding personal data (ER-6)
- `AiInteraction` audits every AI call without storing any submitted content
- Role ladder: `RESIDENT` and `BUSINESS` < `OFFICER` < `ADMIN` < `SUPER_ADMIN`
