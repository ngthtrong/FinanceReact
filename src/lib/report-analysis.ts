import {
  Transaction,
  MonthlyReport,
  MonthlyReportSummary,
  WeeklyComparison,
  LargeExpense,
  OverBudgetCategory,
  SpendingAnomaly,
  CategoryTrend,
  ImprovementSuggestion,
  SavingsAnalysis,
  AppSettings,
} from "@/types";
import { resolveThresholds, ResolvedThresholds } from "./thresholds";
import { formatVND } from "./formatters";

// ── helpers ──

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getWeeksInMonth(year: number, month: number) {
  const weeks: { weekNumber: number; start: Date; end: Date }[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let weekStart = new Date(firstDay);
  // Adjust to Monday
  const dow = weekStart.getDay();
  if (dow !== 1) {
    // keep weekStart as first day of month even if not Monday
  }

  let weekNum = 1;
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    // Go forward to Sunday or end of month
    const daysToSunday = 7 - weekStart.getDay();
    weekEnd.setDate(weekStart.getDate() + (weekStart.getDay() === 0 ? 0 : daysToSunday));
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

    weeks.push({
      weekNumber: weekNum,
      start: new Date(weekStart),
      end: new Date(weekEnd),
    });

    weekNum++;
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
  }

  return weeks;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Main generator ──

export function generateMonthlyReport(
  allTransactions: Transaction[],
  year: number,
  month: number,
  settings?: AppSettings
): MonthlyReport {
  const thresholds = resolveThresholds(settings);

  const monthTx = allTransactions.filter(
    (t) => t.year === year && t.month === month
  );
  const monthExpenses = monthTx.filter(
    (t) => t.transaction_type === "expense" && t.special_tag !== "BigY"
  );
  const monthIncome = monthTx.filter((t) => t.transaction_type === "income");

  // Previous month transactions
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthTx = allTransactions.filter(
    (t) => t.year === prevYear && t.month === prevMonth
  );
  const prevExpenses = prevMonthTx.filter(
    (t) => t.transaction_type === "expense" && t.special_tag !== "BigY"
  );
  const prevIncome = prevMonthTx.filter((t) => t.transaction_type === "income");

  // Historical data (last 6 months excluding current)
  const historicalMonths: { year: number; month: number }[] = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(year, month - 1 - i, 1);
    historicalMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const summary = buildSummary(monthExpenses, monthIncome, prevExpenses, prevIncome, year, month);
  const weeklyComparison = buildWeeklyComparison(monthTx, year, month, thresholds);
  const largeExpenses = findLargeExpenses(monthTx, allTransactions, year, month);
  const overBudgetCategories = findOverBudgetCategories(monthExpenses, thresholds);
  const anomalies = detectAnomalies(allTransactions, year, month);
  const categoryTrends = buildCategoryTrends(allTransactions, year, month);
  const savingsAnalysis = buildSavingsAnalysis(allTransactions, year, month, settings);
  const improvementSuggestions = generateSuggestions(
    summary, overBudgetCategories, anomalies, largeExpenses, savingsAnalysis, categoryTrends
  );

  return {
    year,
    month,
    period: `Tháng ${month}/${year}`,
    summary,
    weeklyComparison,
    largeExpenses,
    overBudgetCategories,
    anomalies,
    categoryTrends,
    improvementSuggestions,
    savingsAnalysis,
  };
}

// ── Summary ──

function buildSummary(
  expenses: Transaction[],
  income: Transaction[],
  prevExpenses: Transaction[],
  prevIncome: Transaction[],
  year: number,
  month: number
): MonthlyReportSummary {
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  // Include BigY in total expense for full picture
  const totalExpenseExBig = expenses
    .filter((t) => t.special_tag !== "BigY")
    .reduce((s, t) => s + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const days = daysInMonth(year, month);
  const avgDailyExpense = totalExpense / Math.max(days, 1);

  const prevTotalIncome = prevIncome.reduce((s, t) => s + t.amount, 0);
  const prevTotalExpense = prevExpenses
    .filter((t) => t.special_tag !== "BigY")
    .reduce((s, t) => s + t.amount, 0);
  const prevSavingsRate = prevTotalIncome > 0
    ? ((prevTotalIncome - prevTotalExpense) / prevTotalIncome) * 100
    : 0;

  return {
    totalIncome,
    totalExpense,
    totalExpenseExBig,
    netCashFlow,
    savingsRate: Math.round(savingsRate * 10) / 10,
    transactionCount: expenses.length + income.length,
    avgDailyExpense: Math.round(avgDailyExpense),
    daysInMonth: days,
    vsLastMonth: {
      expenseChange: totalExpense - prevTotalExpense,
      expenseChangePercent: prevTotalExpense > 0
        ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100
        : 0,
      incomeChange: totalIncome - prevTotalIncome,
      incomeChangePercent: prevTotalIncome > 0
        ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
        : 0,
      savingsRateChange: savingsRate - prevSavingsRate,
    },
  };
}

// ── Weekly Comparison ──

function buildWeeklyComparison(
  monthTx: Transaction[],
  year: number,
  month: number,
  thresholds: ResolvedThresholds
): WeeklyComparison[] {
  const weeks = getWeeksInMonth(year, month);
  const weeklyBudget = thresholds.weeklyTotal;

  return weeks.map((week) => {
    const weekTx = monthTx.filter((t) => {
      const d = new Date(t.date);
      return d >= week.start && d <= week.end;
    });

    const expenses = weekTx.filter(
      (t) => t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const incomes = weekTx.filter((t) => t.transaction_type === "income");

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);

    // Top category by spending
    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];

    const dayCount = Math.max(
      1,
      Math.ceil((week.end.getTime() - week.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    return {
      weekNumber: week.weekNumber,
      weekLabel: `Tuần ${week.weekNumber}`,
      startDate: dateStr(week.start),
      endDate: dateStr(week.end),
      totalExpense,
      totalIncome,
      topCategory: topCat ? topCat[0] : "N/A",
      topCategoryAmount: topCat ? topCat[1] : 0,
      transactionCount: weekTx.length,
      avgDaily: Math.round(totalExpense / dayCount),
      vsWeeklyBudget: weeklyBudget > 0
        ? Math.round(((totalExpense - weeklyBudget) / weeklyBudget) * 1000) / 10
        : 0,
    };
  });
}

// ── Large Expenses ──

function findLargeExpenses(
  monthTx: Transaction[],
  allTx: Transaction[],
  year: number,
  month: number
): LargeExpense[] {
  const expenses = monthTx.filter((t) => t.transaction_type === "expense");
  const totalMonthExpense = expenses.reduce((s, t) => s + t.amount, 0);

  // Calculate historical avg per category (last 6 months)
  const histAvgs: Record<string, { avg: number; std: number }> = {};
  const catAmountsMap: Record<string, number[]> = {};
  for (let i = 1; i <= 6; i++) {
    const d = new Date(year, month - 1 - i, 1);
    const hYear = d.getFullYear();
    const hMonth = d.getMonth() + 1;
    const hTx = allTx.filter(
      (t) => t.year === hYear && t.month === hMonth && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const catTotals: Record<string, number> = {};
    hTx.forEach((t) => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    Object.entries(catTotals).forEach(([cat, amount]) => {
      if (!catAmountsMap[cat]) catAmountsMap[cat] = [];
      catAmountsMap[cat].push(amount);
    });
  }
  Object.entries(catAmountsMap).forEach(([cat, amounts]) => {
    histAvgs[cat] = { avg: mean(amounts), std: stddev(amounts) };
  });

  // Find large individual transactions (> 5% of monthly total or > 500k)
  const threshold = Math.max(totalMonthExpense * 0.05, 500_000);

  return expenses
    .filter((t) => t.amount >= threshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15)
    .map((t) => {
      const catHist = histAvgs[t.category];
      const isAnomalous = catHist
        ? t.amount > catHist.avg + 2 * catHist.std && catHist.std > 0
        : false;

      let reason = "";
      if (t.special_tag === "BigY") {
        reason = "Đánh dấu chi lớn (BigY)";
      } else if (isAnomalous) {
        reason = `Bất thường so với trung bình ${formatVND(Math.round(catHist?.avg || 0))}`;
      } else {
        reason = `Chiếm ${((t.amount / totalMonthExpense) * 100).toFixed(1)}% tổng chi tháng`;
      }

      return {
        id: t.id,
        date: t.date,
        title: t.title,
        amount: t.amount,
        category: t.category,
        category_group: t.category_group,
        percentOfMonthly: totalMonthExpense > 0 ? (t.amount / totalMonthExpense) * 100 : 0,
        isAnomalous,
        reason,
      };
    });
}

// ── Over Budget Categories ──

function findOverBudgetCategories(
  expenses: Transaction[],
  thresholds: ResolvedThresholds
): OverBudgetCategory[] {
  const catTotals: Record<string, { total: number; group: string }> = {};
  expenses.forEach((t) => {
    if (!catTotals[t.category]) catTotals[t.category] = { total: 0, group: t.category_group };
    catTotals[t.category].total += t.amount;
  });

  const results: OverBudgetCategory[] = [];

  Object.entries(catTotals).forEach(([cat, data]) => {
    const monthlyLimit = thresholds.monthly[cat] || 0;
    const weeklyLimit = thresholds.weekly[cat] || 0;

    if (monthlyLimit > 0 && data.total > monthlyLimit) {
      const overAmount = data.total - monthlyLimit;
      const overPercent = (overAmount / monthlyLimit) * 100;

      results.push({
        category: cat,
        group: data.group,
        spent: data.total,
        weeklyLimit,
        monthlyLimit,
        monthlyOverAmount: overAmount,
        monthlyOverPercent: Math.round(overPercent * 10) / 10,
        weeklyOverAmount: weeklyLimit > 0 ? Math.max(0, data.total / 4 - weeklyLimit) : 0,
        weeklyOverPercent: weeklyLimit > 0
          ? Math.round(Math.max(0, ((data.total / 4 - weeklyLimit) / weeklyLimit) * 100) * 10) / 10
          : 0,
        severity: overPercent > 50 ? "critical" : "warning",
      });
    }
  });

  return results.sort((a, b) => b.monthlyOverAmount - a.monthlyOverAmount);
}

// ── Anomaly Detection (Z-Score based) ──

function detectAnomalies(
  allTx: Transaction[],
  year: number,
  month: number
): SpendingAnomaly[] {
  // Get current month spending by category
  const currentMonth = allTx.filter(
    (t) => t.year === year && t.month === month && t.transaction_type === "expense" && t.special_tag !== "BigY"
  );
  const currentCats: Record<string, number> = {};
  currentMonth.forEach((t) => {
    currentCats[t.category] = (currentCats[t.category] || 0) + t.amount;
  });

  // Build historical data per category (last 6 months)
  const catHistory: Record<string, number[]> = {};
  for (let i = 1; i <= 6; i++) {
    const d = new Date(year, month - 1 - i, 1);
    const hYear = d.getFullYear();
    const hMonth = d.getMonth() + 1;
    const hTx = allTx.filter(
      (t) => t.year === hYear && t.month === hMonth && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const catTotals: Record<string, number> = {};
    hTx.forEach((t) => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    // Ensure all categories get zero for months they don't appear
    const allCats = new Set([...Object.keys(catTotals), ...Object.keys(currentCats)]);
    allCats.forEach((cat) => {
      if (!catHistory[cat]) catHistory[cat] = [];
      catHistory[cat].push(catTotals[cat] || 0);
    });
  }

  const anomalies: SpendingAnomaly[] = [];

  Object.entries(currentCats).forEach(([cat, amount]) => {
    const history = catHistory[cat] || [];
    if (history.length < 3) return; // Need minimum data

    const avg = mean(history);
    const std = stddev(history);

    if (std === 0 && amount > avg * 1.5) {
      // Consistent spending then spike
      anomalies.push({
        category: cat,
        currentAmount: amount,
        avgAmount: avg,
        stdDev: 0,
        zScore: 99,
        changePercent: avg > 0 ? ((amount - avg) / avg) * 100 : 100,
        severity: "severe",
        description: `${cat} tăng đột biến từ mức đều ${formatVND(Math.round(avg))}/tháng lên ${formatVND(amount)}`,
      });
      return;
    }

    if (std === 0) return;

    const zScore = (amount - avg) / std;

    if (zScore >= 1.5) {
      const changePercent = ((amount - avg) / avg) * 100;
      let severity: "mild" | "moderate" | "severe" = "mild";
      if (zScore >= 3) severity = "severe";
      else if (zScore >= 2) severity = "moderate";

      anomalies.push({
        category: cat,
        currentAmount: amount,
        avgAmount: Math.round(avg),
        stdDev: Math.round(std),
        zScore: Math.round(zScore * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        severity,
        description: `${cat}: ${formatVND(amount)} (TB: ${formatVND(Math.round(avg))}, +${Math.round(changePercent)}%)`,
      });
    }
  });

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

// ── Category Trends ──

function buildCategoryTrends(
  allTx: Transaction[],
  year: number,
  month: number
): CategoryTrend[] {
  // Gather last 6 months of data per category
  const months: { year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const catData: Record<string, { group: string; amounts: Record<string, number> }> = {};

  months.forEach((m) => {
    const mTx = allTx.filter(
      (t) => t.year === m.year && t.month === m.month && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    mTx.forEach((t) => {
      const key = `${m.year}-${m.month}`;
      if (!catData[t.category]) catData[t.category] = { group: t.category_group, amounts: {} };
      catData[t.category].amounts[key] = (catData[t.category].amounts[key] || 0) + t.amount;
    });
  });

  return Object.entries(catData)
    .map(([category, data]) => {
      const monthAmounts = months.map((m) => ({
        month: m.month,
        year: m.year,
        amount: data.amounts[`${m.year}-${m.month}`] || 0,
      }));

      const currentMonth = monthAmounts[monthAmounts.length - 1]?.amount || 0;
      const last3 = monthAmounts.slice(-3).map((m) => m.amount);
      const avgLast3 = mean(last3);
      const avgLast6 = mean(monthAmounts.map((m) => m.amount));

      // Determine trend (compare recent 3 vs previous 3)
      const recent3 = mean(monthAmounts.slice(-3).map((m) => m.amount));
      const older3 = mean(monthAmounts.slice(0, 3).map((m) => m.amount));
      const trendPercent = older3 > 0 ? ((recent3 - older3) / older3) * 100 : 0;

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (trendPercent > 15) trend = "increasing";
      else if (trendPercent < -15) trend = "decreasing";

      return {
        category,
        group: data.group,
        months: monthAmounts,
        currentMonth,
        avgLast3: Math.round(avgLast3),
        avgLast6: Math.round(avgLast6),
        trend,
        trendPercent: Math.round(trendPercent * 10) / 10,
      };
    })
    .sort((a, b) => b.currentMonth - a.currentMonth)
    .slice(0, 15);
}

// ── Savings Analysis ──

function buildSavingsAnalysis(
  allTx: Transaction[],
  year: number,
  month: number,
  settings?: AppSettings
): SavingsAnalysis {
  const target = settings?.savingsGoals?.monthlyTarget || 0;
  const targetRate = target > 0 ? 20 : 20; // Default 20% target

  // Current month
  const monthTx = allTx.filter((t) => t.year === year && t.month === month);
  const income = monthTx.filter((t) => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY").reduce((s, t) => s + t.amount, 0);
  const saved = income - expense;
  const currentRate = income > 0 ? (saved / income) * 100 : 0;

  // Find best and worst months in the year
  let bestMonth = { month: 1, rate: -Infinity };
  let worstMonth = { month: 1, rate: Infinity };

  for (let m = 1; m <= 12; m++) {
    const mTx = allTx.filter((t) => t.year === year && t.month === m);
    const mInc = mTx.filter((t) => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0);
    const mExp = mTx.filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY").reduce((s, t) => s + t.amount, 0);
    if (mInc === 0 && mExp === 0) continue;
    const rate = mInc > 0 ? ((mInc - mExp) / mInc) * 100 : -100;
    if (rate > bestMonth.rate) bestMonth = { month: m, rate: Math.round(rate * 10) / 10 };
    if (rate < worstMonth.rate) worstMonth = { month: m, rate: Math.round(rate * 10) / 10 };
  }

  if (bestMonth.rate === -Infinity) bestMonth = { month, rate: 0 };
  if (worstMonth.rate === Infinity) worstMonth = { month, rate: 0 };

  return {
    currentSavingsRate: Math.round(currentRate * 10) / 10,
    targetSavingsRate: targetRate,
    monthlyTarget: target || Math.round(income * 0.2),
    actualSaved: saved,
    gap: (target || Math.round(income * 0.2)) - saved,
    projectedYearly: saved * 12,
    bestMonth,
    worstMonth,
  };
}

// ── Improvement Suggestions ──

function generateSuggestions(
  summary: MonthlyReportSummary,
  overBudget: OverBudgetCategory[],
  anomalies: SpendingAnomaly[],
  largeExpenses: LargeExpense[],
  savings: SavingsAnalysis,
  trends: CategoryTrend[]
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  // 1. Over-budget categories
  if (overBudget.length > 0) {
    const totalOver = overBudget.reduce((s, c) => s + c.monthlyOverAmount, 0);
    const topCats = overBudget.slice(0, 3).map((c) => c.category);
    suggestions.push({
      id: "over-budget",
      priority: "high",
      icon: "🚨",
      title: "Kiểm soát danh mục vượt mức",
      description: `${overBudget.length} danh mục vượt ngân sách tổng ${formatVND(totalOver)}. Tập trung vào ${topCats.join(", ")}.`,
      potentialSaving: totalOver,
      actionItems: overBudget.slice(0, 3).map(
        (c) => `Giảm ${c.category} xuống ${formatVND(c.monthlyLimit)} (đang ${formatVND(c.spent)}, vượt ${formatVND(c.monthlyOverAmount)})`
      ),
    });
  }

  // 2. Anomalous spending
  const severeAnomalies = anomalies.filter((a) => a.severity === "severe" || a.severity === "moderate");
  if (severeAnomalies.length > 0) {
    const totalAnomaly = severeAnomalies.reduce((s, a) => s + (a.currentAmount - a.avgAmount), 0);
    suggestions.push({
      id: "anomalies",
      priority: "high",
      icon: "⚠️",
      title: "Chi tiêu bất thường cần xem xét",
      description: `${severeAnomalies.length} danh mục có chi tiêu bất thường, tổng vượt ${formatVND(totalAnomaly)} so với trung bình.`,
      potentialSaving: totalAnomaly,
      actionItems: severeAnomalies.slice(0, 3).map(
        (a) => `${a.category}: đang ${formatVND(a.currentAmount)} (TB: ${formatVND(a.avgAmount)}, +${Math.round(a.changePercent)}%)`
      ),
    });
  }

  // 3. Savings rate improvement
  if (savings.currentSavingsRate < savings.targetSavingsRate) {
    const gap = savings.gap;
    suggestions.push({
      id: "savings-gap",
      priority: gap > 0 ? "high" : "medium",
      icon: "💰",
      title: "Tăng tỷ lệ tiết kiệm",
      description: `Tỷ lệ tiết kiệm ${savings.currentSavingsRate}% thấp hơn mục tiêu ${savings.targetSavingsRate}%. Cần tiết kiệm thêm ${formatVND(Math.max(0, gap))}/tháng.`,
      potentialSaving: Math.max(0, gap),
      actionItems: [
        `Đặt mục tiêu tiết kiệm ${formatVND(savings.monthlyTarget)}/tháng`,
        "Tự động chuyển tiết kiệm ngay khi nhận lương",
        "Giảm chi tiêu tuỳ ý (giải trí, ăn vặt) 10-20%",
      ],
    });
  }

  // 4. Large recurring expenses
  const highExpenses = largeExpenses.filter((e) => e.percentOfMonthly > 10);
  if (highExpenses.length > 0) {
    suggestions.push({
      id: "large-expenses",
      priority: "medium",
      icon: "📊",
      title: "Xem xét các khoản chi lớn",
      description: `${highExpenses.length} giao dịch chiếm hơn 10% tổng chi tháng. Cân nhắc có thể tối ưu.`,
      potentialSaving: 0,
      actionItems: highExpenses.slice(0, 3).map(
        (e) => `${e.title}: ${formatVND(e.amount)} (${e.percentOfMonthly.toFixed(1)}% tổng chi)`
      ),
    });
  }

  // 5. Increasing trends
  const increasingCats = trends.filter((t) => t.trend === "increasing" && t.trendPercent > 30);
  if (increasingCats.length > 0) {
    const totalIncrease = increasingCats.reduce(
      (s, c) => s + (c.currentMonth - c.avgLast6), 0
    );
    suggestions.push({
      id: "trending-up",
      priority: "medium",
      icon: "📈",
      title: "Danh mục tăng liên tục",
      description: `${increasingCats.length} danh mục có xu hướng tăng liên tục trong 6 tháng qua.`,
      potentialSaving: Math.max(0, totalIncrease),
      actionItems: increasingCats.slice(0, 3).map(
        (c) => `${c.category}: tăng ${c.trendPercent.toFixed(0)}% (hiện ${formatVND(c.currentMonth)}, TB 6 tháng: ${formatVND(c.avgLast6)})`
      ),
    });
  }

  // 6. Daily spending optimization
  if (summary.avgDailyExpense > 0) {
    const targetDaily = Math.round(summary.avgDailyExpense * 0.9);
    suggestions.push({
      id: "daily-budget",
      priority: "low",
      icon: "📅",
      title: "Áp dụng ngân sách hàng ngày",
      description: `Chi trung bình ${formatVND(summary.avgDailyExpense)}/ngày. Giảm 10% xuống ${formatVND(targetDaily)}/ngày có thể tiết kiệm ${formatVND(Math.round(summary.avgDailyExpense * 0.1 * summary.daysInMonth))}/tháng.`,
      potentialSaving: Math.round(summary.avgDailyExpense * 0.1 * summary.daysInMonth),
      actionItems: [
        `Đặt giới hạn chi tiêu ${formatVND(targetDaily)}/ngày`,
        "Theo dõi chi tiêu hàng ngày vào cuối ngày",
        "Dùng quy tắc 24h cho mua sắm > 200k",
      ],
    });
  }

  // 7. Positive reinforcement
  if (summary.vsLastMonth.expenseChangePercent < -5) {
    suggestions.push({
      id: "positive-trend",
      priority: "low",
      icon: "🎉",
      title: "Chi tiêu giảm so với tháng trước",
      description: `Chi tiêu giảm ${Math.abs(summary.vsLastMonth.expenseChangePercent).toFixed(1)}% so với tháng trước. Tiếp tục duy trì!`,
      potentialSaving: 0,
      actionItems: [
        "Duy trì thói quen chi tiêu hiện tại",
        "Đặt mục tiêu giảm thêm 5% tháng tới",
      ],
    });
  }

  return suggestions.sort((a, b) => {
    const prio = { high: 0, medium: 1, low: 2 };
    return prio[a.priority] - prio[b.priority];
  });
}
