import "dotenv/config";
import pg from "pg";
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const tables = await c.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`);
const fks = await c.query(`
  SELECT COUNT(*)::int AS n FROM information_schema.table_constraints
  WHERE constraint_type='FOREIGN KEY' AND table_schema='public'`);
const idx = await c.query(`SELECT COUNT(*)::int AS n FROM pg_indexes WHERE schemaname='public'`);
const enums = await c.query(`
  SELECT t.typname, COUNT(e.enumlabel)::int AS labels
  FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
  JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'
  GROUP BY t.typname ORDER BY t.typname`);
const ver = await c.query("SELECT version()");
console.log("Postgres:", ver.rows[0].version.split(" ").slice(0,2).join(" "));
console.log("\nTables (" + tables.rows.length + "):");
console.log("  " + tables.rows.map(r=>r.table_name).join(", "));
console.log("\nEnums (" + enums.rows.length + "):");
console.log("  " + enums.rows.map(r=>`${r.typname}(${r.labels})`).join(", "));
console.log("\nForeign keys:", fks.rows[0].n, "| Indexes:", idx.rows[0].n);
await c.end();
