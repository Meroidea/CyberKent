# CyberKent database

| File | What it is |
|---|---|
| `cyberkent_database.sql` | Full `pg_dump` of the development database (PostgreSQL 18, Neon, `ap-southeast-2`): schema, constraints, indexes and the synthetic seed data. Password hashes are redacted. |
| `erd/erd-prisma-studio-visualizer.png` | Physical ERD as drawn by Prisma Studio's Visualizer against the live database. |
| `erd/erd-1-identity.png` … `erd-4-community.png` | Logical ERDs by domain, generated from `backend/prisma/schema.prisma` (crow's-foot notation). |
| `erd/*.mmd` | The Mermaid source of each ERD, regenerable from the schema. |

The source of truth is `backend/prisma/schema.prisma` and `backend/prisma/migrations/`.
Schema changes are made only through Prisma migrations (Rule 5.4).

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

## At a glance

- 26 domain tables, 14 enumerated types, 35 foreign keys, 86 indexes, 11 CHECK constraints
- Third normal form; every relationship enforced by a foreign key
- Soft deletion (`deletedAt`) on records with audit or evidentiary weight
- `retentionUntil` on every table holding personal data (ER-6)
- `AiInteraction` audits every AI call without storing any submitted content
