/**
 * Migration script: CSV files -> Neon Postgres
 * Run once: node --env-file=.env.local scripts/migrate.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create .env.local first.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function readCSV(filename) {
  const content = readFileSync(join(ROOT, "data", filename), "utf-8");
  return Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => h.trim(),
  }).data;
}

async function runSchema() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.query(stmt);
  }
  console.log("Schema created");
}

async function migrateCategories() {
  const rows = readCSV("categories.csv");
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const params = [];
    const placeholders = chunk.map((r) => {
      const s = params.length + 1;
      params.push(r.abbreviation, r.full_name, r.english_name || "", r.category_type, r.group);
      return "($" + s + ",$" + (s+1) + ",$" + (s+2) + ",$" + (s+3) + ",$" + (s+4) + ")";
    });
    await client.query(
      "INSERT INTO categories (abbreviation, full_name, english_name, category_type, \"group\") VALUES " + placeholders.join(",") +
      " ON CONFLICT (abbreviation, category_type) DO UPDATE SET full_name=EXCLUDED.full_name, english_name=EXCLUDED.english_name, \"group\"=EXCLUDED.\"group\"",
      params
    );
  }
  console.log("Categories: " + rows.length + " rows");
}

async function migrateTransactions() {
  const rows = readCSV("transactions.csv");
  const CHUNK = 300;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const params = [];
    const placeholders = chunk.map((r) => {
      const s = params.length + 1;
      params.push(r.id, r.date, r.title, r.amount, r.transaction_type, r.category, r.category_group, r.special_tag || "", r.budget_impact, r.year, r.month, r.day_of_week);
      return "($" + s + ",$" + (s+1) + ",$" + (s+2) + ",$" + (s+3) + ",$" + (s+4) + ",$" + (s+5) + ",$" + (s+6) + ",$" + (s+7) + ",$" + (s+8) + ",$" + (s+9) + ",$" + (s+10) + ",$" + (s+11) + ")";
    });
    await client.query(
      "INSERT INTO transactions (id,date,title,amount,transaction_type,category,category_group,special_tag,budget_impact,year,month,day_of_week) VALUES " + placeholders.join(",") + " ON CONFLICT (id) DO NOTHING",
      params
    );
    console.log("transactions: " + Math.min(i + CHUNK, rows.length) + "/" + rows.length);
  }
  await client.query("SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions))");
  console.log("Transactions: " + rows.length + " rows");
}

async function migrateLoans() {
  const rows = readCSV("loans.csv");
  if (rows.length === 0) { console.log("Loans: 0 rows"); return; }
  const params = [];
  const placeholders = rows.map((r) => {
    const s = params.length + 1;
    params.push(r.loan_id, r.title, r.amount, r.date, r.loan_type, r.status, r.counterparty, r.related_tags || "", r.original_category, r.year, r.month);
    return "($" + s + ",$" + (s+1) + ",$" + (s+2) + ",$" + (s+3) + ",$" + (s+4) + ",$" + (s+5) + ",$" + (s+6) + ",$" + (s+7) + ",$" + (s+8) + ",$" + (s+9) + ",$" + (s+10) + ")";
  });
  await client.query(
    "INSERT INTO loans (loan_id,title,amount,date,loan_type,status,counterparty,related_tags,original_category,year,month) VALUES " + placeholders.join(",") + " ON CONFLICT (loan_id) DO NOTHING",
    params
  );
  await client.query("SELECT setval('loans_loan_id_seq', (SELECT MAX(loan_id) FROM loans))");
  console.log("Loans: " + rows.length + " rows");
}

async function migratePayments() {
  const rows = readCSV("payments.csv");
  if (rows.length === 0) { console.log("Payments: 0 rows"); return; }
  const params = [];
  const placeholders = rows.map((r) => {
    const s = params.length + 1;
    params.push(r.payment_id, r.loan_id, r.amount, r.date, r.note || "");
    return "($" + s + ",$" + (s+1) + ",$" + (s+2) + ",$" + (s+3) + ",$" + (s+4) + ")";
  });
  await client.query(
    "INSERT INTO payments (payment_id,loan_id,amount,date,note) VALUES " + placeholders.join(",") + " ON CONFLICT (payment_id) DO NOTHING",
    params
  );
  await client.query("SELECT setval('payments_payment_id_seq', (SELECT MAX(payment_id) FROM payments))");
  console.log("Payments: " + rows.length + " rows");
}

async function main() {
  console.log("Starting migration...");
  await client.connect();
  try {
    await runSchema();
    await migrateCategories();
    await migrateTransactions();
    await migrateLoans();
    await migratePayments();
    console.log("Migration complete!");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
