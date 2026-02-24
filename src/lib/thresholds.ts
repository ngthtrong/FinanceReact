import { SPENDING_THRESHOLDS } from "./constants";
import { DEFAULT_SETTINGS } from "./settings";
import { AppSettings } from "@/types";

export interface ResolvedThresholds {
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  yearly: Record<string, number>;
  weeklyTotal: number;
  monthlyTotal: number;
}

export function resolveThresholds(settings?: AppSettings): ResolvedThresholds {
  const s = settings ?? DEFAULT_SETTINGS;
  const customLimits = s.categoryLimits || {};

  const weekly: Record<string, number> = { ...SPENDING_THRESHOLDS.weekly };
  const monthly: Record<string, number> = { ...SPENDING_THRESHOLDS.monthly };
  const yearly: Record<string, number> = {};

  Object.entries(customLimits).forEach(([cat, limits]) => {
    if (limits.weekly !== undefined) weekly[cat] = limits.weekly;
    if (limits.monthly !== undefined) monthly[cat] = limits.monthly;
    if (limits.yearly !== undefined) yearly[cat] = limits.yearly;
  });

  // Derive yearly from monthly for categories without explicit yearly limit
  Object.entries(monthly).forEach(([cat, amount]) => {
    if (!yearly[cat]) {
      yearly[cat] = amount * 12;
    }
  });

  return {
    weekly,
    monthly,
    yearly,
    weeklyTotal: s.totalLimits?.weeklyTotal ?? SPENDING_THRESHOLDS.weeklyTotal,
    monthlyTotal: s.totalLimits?.monthlyTotal ?? SPENDING_THRESHOLDS.monthlyTotal,
  };
}
