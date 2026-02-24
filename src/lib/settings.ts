import { sql } from "@/lib/db";
import { AppSettings } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  savingsGoals: { monthlyTarget: 0, yearlyTarget: 0, notes: "" },
  categoryLimits: {},
};

export async function readSettings(): Promise<AppSettings> {
  try {
    const rows = await sql`SELECT data FROM app_settings WHERE id = 1`;
    if (rows.length === 0) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(rows[0] as { data: AppSettings }).data };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id   INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `;
  await sql`
    INSERT INTO app_settings (id, data)
    VALUES (1, ${JSON.stringify(settings)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}
