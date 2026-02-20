/**
 * One-time migration: create balance_config table
 * Run: node --env-file=.env.local scripts/migrate-balance-config.mjs
 */
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS balance_config (
    id    INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    cash  BIGINT NOT NULL DEFAULT 0,
    bank  BIGINT NOT NULL DEFAULT 0
  )
`);

await client.query(`
  INSERT INTO balance_config (id, cash, bank)
  VALUES (1, 0, 0)
  ON CONFLICT (id) DO NOTHING
`);

console.log("balance_config table ready.");
await client.end();
