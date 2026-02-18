import { Transaction, SpendingWarning } from "@/types";
import { resolveThresholds, ResolvedThresholds } from "./thresholds";
import { getWeekRange, formatVND } from "./formatters";

export function generateWarnings(
  transactions: Transaction[],
  year: number,
  month: number,
  thresholds?: ResolvedThresholds
): SpendingWarning[] {
  const warnings: SpendingWarning[] = [];
  const resolved = thresholds ?? resolveThresholds();
  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekRange(now);

  const thisMonth = transactions.filter(
    (t) =>
      t.transaction_type === "expense" &&
      t.year === year &&
      t.month === month &&
      t.special_tag !== "BigY"
  );

  const thisWeek = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.transaction_type === "expense" &&
      d >= weekStart &&
      d <= weekEnd &&
      t.special_tag !== "BigY"
    );
  });

  // Weekly category overspend
  const weeklyByCat: Record<string, number> = {};
  thisWeek.forEach((t) => {
    weeklyByCat[t.category] = (weeklyByCat[t.category] || 0) + t.amount;
  });

  Object.entries(weeklyByCat).forEach(([cat, amount]) => {
    const threshold = resolved.weekly[cat];
    if (threshold && amount > threshold) {
      const pct = ((amount - threshold) / threshold) * 100;
      warnings.push({
        id: `weekly-${cat}`,
        severity: pct > 50 ? "critical" : "warning",
        type: "weekly_overspend",
        title: `Chi ${cat} vượt mức tuần`,
        message: `Bạn đã chi ${formatVND(amount)} cho ${cat} tuần này, vượt ${formatVND(amount - threshold)} so với ngưỡng ${formatVND(threshold)}.`,
        category: cat,
        currentAmount: amount,
        thresholdAmount: threshold,
        percentageOver: pct,
      });
    }
  });

  // Monthly category overspend
  const monthlyByCat: Record<string, number> = {};
  thisMonth.forEach((t) => {
    monthlyByCat[t.category] = (monthlyByCat[t.category] || 0) + t.amount;
  });

  Object.entries(monthlyByCat).forEach(([cat, amount]) => {
    const threshold = resolved.monthly[cat];
    if (threshold && amount > threshold) {
      const pct = ((amount - threshold) / threshold) * 100;
      warnings.push({
        id: `monthly-${cat}`,
        severity: pct > 50 ? "critical" : "warning",
        type: "monthly_overspend",
        title: `Chi ${cat} vượt mức tháng`,
        message: `Bạn đã chi ${formatVND(amount)} cho ${cat} tháng này, vượt ${formatVND(amount - threshold)} so với ngưỡng ${formatVND(threshold)}.`,
        category: cat,
        currentAmount: amount,
        thresholdAmount: threshold,
        percentageOver: pct,
      });
    }
  });

  // Monthly total overspend
  const totalMonthly = thisMonth.reduce((s, t) => s + t.amount, 0);
  if (totalMonthly > resolved.monthlyTotal) {
    const pct =
      ((totalMonthly - resolved.monthlyTotal) / resolved.monthlyTotal) * 100;
    warnings.push({
      id: "monthly-total",
      severity: pct > 50 ? "critical" : "warning",
      type: "monthly_overspend",
      title: "Tổng chi tiêu vượt mức tháng",
      message: `Tổng chi tiêu tháng này ${formatVND(totalMonthly)}, vượt ${formatVND(totalMonthly - resolved.monthlyTotal)} so với ngưỡng.`,
      currentAmount: totalMonthly,
      thresholdAmount: resolved.monthlyTotal,
      percentageOver: pct,
    });
  }

  // Category spike: compare current month vs 6-month avg per category
  const sixMonthsAgo = new Date(year, month - 7, 1);
  const lastMonthEnd = new Date(year, month - 1, 0);
  const historical = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.transaction_type === "expense" &&
      d >= sixMonthsAgo &&
      d <= lastMonthEnd &&
      t.special_tag !== "BigY"
    );
  });

  const histCatTotals: Record<string, number> = {};
  const histMonthCount =
    new Set(historical.map((t) => `${t.year}-${t.month}`)).size || 1;
  historical.forEach((t) => {
    histCatTotals[t.category] = (histCatTotals[t.category] || 0) + t.amount;
  });

  Object.entries(monthlyByCat).forEach(([cat, amount]) => {
    const avgMonthly = (histCatTotals[cat] || 0) / histMonthCount;
    if (avgMonthly > 0 && amount > avgMonthly * 1.5) {
      const pct = ((amount - avgMonthly) / avgMonthly) * 100;
      if (!warnings.find((w) => w.id === `monthly-${cat}`)) {
        warnings.push({
          id: `spike-${cat}`,
          severity: amount > avgMonthly * 2 ? "critical" : "warning",
          type: "category_spike",
          title: `${cat} tăng đột biến`,
          message: `Chi ${cat} tháng này (${formatVND(amount)}) cao hơn ${pct.toFixed(0)}% so với trung bình ${formatVND(Math.round(avgMonthly))}/tháng.`,
          category: cat,
          currentAmount: amount,
          thresholdAmount: avgMonthly,
          percentageOver: pct,
        });
      }
    }
  });

  // Net income warning
  const monthlyIncome = transactions
    .filter(
      (t) =>
        t.transaction_type === "income" &&
        t.year === year &&
        t.month === month &&
        t.special_tag !== "BigY"
    )
    .reduce((s, t) => s + t.amount, 0);

  const netMonth = monthlyIncome - totalMonthly;
  if (netMonth < 0 && now.getDate() > 15) {
    warnings.push({
      id: "low-balance",
      severity: "critical",
      type: "low_balance",
      title: "Dòng tiền ròng âm",
      message: `Chi tiêu đã vượt thu nhập ${formatVND(Math.abs(netMonth))} tháng này. Cần kiểm soát chi tiêu ngay.`,
      currentAmount: netMonth,
      thresholdAmount: 0,
      percentageOver: 100,
    });
  }

  // Tips
  if (warnings.length === 0) {
    warnings.push({
      id: "tip-good",
      severity: "info",
      type: "tip",
      title: "Tài chính ổn định",
      message: "Chi tiêu của bạn đang nằm trong ngưỡng kiểm soát. Hãy duy trì thói quen tốt này!",
      currentAmount: 0,
      thresholdAmount: 0,
      percentageOver: 0,
    });
  }

  return warnings.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}
