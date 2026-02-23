// scripts/migrate-planned.mjs
// Run: node scripts/migrate-planned.mjs
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Creating planned_transactions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS planned_transactions (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      amount        BIGINT NOT NULL,
      planned_date  DATE NOT NULL,
      type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category      TEXT NOT NULL DEFAULT '',
      recurrence    TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'monthly', 'yearly')),
      is_active     BOOLEAN NOT NULL DEFAULT true,
      note          TEXT NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_planned_date ON planned_transactions(planned_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_planned_type ON planned_transactions(type)`;
  console.log("Done! planned_transactions table is ready.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
