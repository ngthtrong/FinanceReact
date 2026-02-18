import Papa from "papaparse";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function readCSV<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeCSV(
  filename: string,
  data: any[],
  headers: string[]
): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  const csv = Papa.unparse(data, { columns: headers });
  fs.writeFileSync(filePath, csv, "utf-8");
}

export async function appendRow<T>(
  filename: string,
  row: T,
  headers: string[]
): Promise<void> {
  const data = await readCSV<T>(filename);
  data.push(row);
  await writeCSV(filename, data, headers);
}

export function getNextId(data: { id?: number; loan_id?: number; payment_id?: number }[]): number {
  const ids = data.map((d) => d.id ?? d.loan_id ?? d.payment_id ?? 0);
  return Math.max(0, ...ids) + 1;
}

export const TRANSACTION_HEADERS = [
  "id", "date", "title", "amount", "transaction_type",
  "category", "category_group", "special_tag", "budget_impact",
  "year", "month", "day_of_week",
];

export const LOAN_HEADERS = [
  "loan_id", "title", "amount", "date", "loan_type",
  "status", "counterparty", "related_tags", "original_category",
  "year", "month",
];

export const CATEGORY_HEADERS = [
  "abbreviation", "full_name", "english_name", "category_type", "group",
];

export const PAYMENT_HEADERS = [
  "payment_id", "loan_id", "amount", "date", "note",
];
