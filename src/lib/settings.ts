import fs from "fs";
import path from "path";
import { AppSettings } from "@/types";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

const DEFAULT_SETTINGS: AppSettings = {
  savingsGoals: { monthlyTarget: 0, yearlyTarget: 0, notes: "" },
  categoryLimits: {},
};

export function readSettings(): AppSettings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return DEFAULT_SETTINGS;
    }
    const content = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
