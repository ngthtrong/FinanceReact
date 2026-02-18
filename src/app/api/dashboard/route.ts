import { NextRequest, NextResponse } from "next/server";
import { readCSV } from "@/lib/csv";
import {
  Transaction,
  Category,
  Loan,
  Payment,
  DashboardData,
  CashFlowSummary,
  GroupSpending,
  CategorySpending,
  MonthlyTrend,
  LoanSummary,
} from "@/types";
import { calculateHealthScore } from "@/lib/health-score";
import { generateWarnings } from "@/lib/warnings";
import { readSettings } from "@/lib/settings";
import { resolveThresholds } from "@/lib/thresholds";
import { getMonthLabel } from "@/lib/formatters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const dateFromParam = searchParams.get("date_from");
    const dateToParam = searchParams.get("date_to");

    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const hasDateRange = dateFromParam && dateToParam;
    const hasFilters = yearParam || monthParam || hasDateRange;

    const [transactions, categories, loans] = await Promise.all([
      readCSV<Transaction>("transactions.csv"),
      readCSV<Category>("categories.csv"),
      readCSV<Loan>("loans.csv"),
    ]);

    // Read payments and build paid map
    const allPayments = await readCSV<Payment>("payments.csv");
    const paidMap: Record<number, number> = {};
    allPayments.forEach((p) => {
      paidMap[p.loan_id] = (paidMap[p.loan_id] || 0) + p.amount;
    });

    // --- Summary ---
    let periodTransactions: Transaction[];
    if (hasDateRange) {
      periodTransactions = transactions.filter(
        (t) => t.date >= dateFromParam && t.date <= dateToParam
      );
    } else if (yearParam || monthParam) {
      periodTransactions = monthParam
        ? transactions.filter((t) => t.year === year && t.month === month)
        : transactions.filter((t) => t.year === year);
    } else {
      periodTransactions = transactions;
    }

    const totalIncome = periodTransactions
      .filter((t) => t.transaction_type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = periodTransactions
      .filter((t) => t.transaction_type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Excluding BigY items
    const totalIncomeExcludingBig = periodTransactions
      .filter((t) => t.transaction_type === "income" && t.special_tag !== "BigY")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpenseExcludingBig = periodTransactions
      .filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY")
      .reduce((s, t) => s + t.amount, 0);

    const netCashFlowExcludingBig = totalIncomeExcludingBig - totalExpenseExcludingBig;

    const period = hasDateRange
      ? `${dateFromParam} - ${dateToParam}`
      : hasFilters
        ? (monthParam ? `T${month}/${year}` : `${year}`)
        : "Tất cả";

    // --- Current Balance (all-time, adjusted for outstanding loans) ---
    const allTimeIncome = transactions
      .filter((t) => t.transaction_type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const allTimeExpense = transactions
      .filter((t) => t.transaction_type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const outstandingBorrowing = loans
      .filter((l) => l.loan_type === "borrowing" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);
    const outstandingLending = loans
      .filter((l) => l.loan_type === "lending" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);
    const currentBalance = allTimeIncome - allTimeExpense + outstandingBorrowing - outstandingLending;

    const summary: CashFlowSummary = {
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsRate: Math.round(savingsRate * 10) / 10,
      totalIncomeExcludingBig,
      totalExpenseExcludingBig,
      netCashFlowExcludingBig,
      period,
    };

    // --- Health Score ---
    const healthScore = calculateHealthScore(transactions, loans, 6, paidMap);

    // --- Spending By Group ---
    const expenses = periodTransactions.filter(
      (t) => t.transaction_type === "expense"
    );
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

    const groupMap: Record<string, { total: number; categories: Record<string, { total: number; count: number }> }> = {};

    expenses.forEach((t) => {
      if (!groupMap[t.category_group]) {
        groupMap[t.category_group] = { total: 0, categories: {} };
      }
      groupMap[t.category_group].total += t.amount;

      if (!groupMap[t.category_group].categories[t.category]) {
        groupMap[t.category_group].categories[t.category] = { total: 0, count: 0 };
      }
      groupMap[t.category_group].categories[t.category].total += t.amount;
      groupMap[t.category_group].categories[t.category].count += 1;
    });

    const spendingByGroup: GroupSpending[] = Object.entries(groupMap)
      .map(([group, data]) => {
        const categoryEntries: CategorySpending[] = Object.entries(data.categories)
          .map(([cat, catData]) => ({
            category: cat,
            group,
            total: catData.total,
            percentage: totalExp > 0 ? Math.round((catData.total / totalExp) * 1000) / 10 : 0,
            count: catData.count,
          }))
          .sort((a, b) => b.total - a.total);

        return {
          group,
          total: data.total,
          percentage: totalExp > 0 ? Math.round((data.total / totalExp) * 1000) / 10 : 0,
          categories: categoryEntries,
        };
      })
      .sort((a, b) => b.total - a.total);

    // --- Spending By Category (flat list) ---
    const catMap: Record<string, { total: number; count: number; group: string }> = {};
    expenses.forEach((t) => {
      if (!catMap[t.category]) {
        catMap[t.category] = { total: 0, count: 0, group: t.category_group };
      }
      catMap[t.category].total += t.amount;
      catMap[t.category].count += 1;
    });

    const spendingByCategory: CategorySpending[] = Object.entries(catMap)
      .map(([category, data]) => ({
        category,
        group: data.group,
        total: data.total,
        percentage: totalExp > 0 ? Math.round((data.total / totalExp) * 1000) / 10 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // --- Monthly Trend (last 12 months) ---
    const trendMonths: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      trendMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const monthlyTrend: MonthlyTrend[] = trendMonths.map((tm) => {
      const monthTx = transactions.filter(
        (t) => t.year === tm.year && t.month === tm.month
      );
      const income = monthTx
        .filter((t) => t.transaction_type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.transaction_type === "expense")
        .reduce((s, t) => s + t.amount, 0);

      return {
        year: tm.year,
        month: tm.month,
        label: getMonthLabel(tm.year, tm.month),
        income,
        expense,
        net: income - expense,
      };
    });

    // --- Recent Transactions ---
    const recentTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    // --- Warnings ---
    const settings = readSettings();
    const resolvedThresholds = resolveThresholds(settings);
    const warnings = generateWarnings(transactions, year, month, resolvedThresholds);

    // --- Loan Summary ---
    const loanSummary: LoanSummary = {
      totalBorrowing: loans
        .filter((l) => l.loan_type === "borrowing")
        .reduce((s, l) => s + l.amount, 0),
      totalLending: loans
        .filter((l) => l.loan_type === "lending")
        .reduce((s, l) => s + l.amount, 0),
      outstandingBorrowing: loans
        .filter((l) => l.loan_type === "borrowing" && l.status !== "paid")
        .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0),
      outstandingLending: loans
        .filter((l) => l.loan_type === "lending" && l.status !== "paid")
        .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0),
      netDebt:
        loans
          .filter((l) => l.loan_type === "borrowing" && l.status !== "paid")
          .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0) -
        loans
          .filter((l) => l.loan_type === "lending" && l.status !== "paid")
          .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0),
      borrowingCount: loans.filter((l) => l.loan_type === "borrowing").length,
      lendingCount: loans.filter((l) => l.loan_type === "lending").length,
    };

    const dashboardData: DashboardData = {
      summary,
      currentBalance,
      healthScore,
      spendingByCategory,
      spendingByGroup,
      monthlyTrend,
      recentTransactions,
      warnings,
      loanSummary,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error computing dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to compute dashboard data" },
      { status: 500 }
    );
  }
}
