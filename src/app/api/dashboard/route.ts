import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  Transaction,
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

function toTx(r: Record<string, unknown>): Transaction {
  return {
    ...r,
    date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
    amount: Number(r.amount),
    budget_impact: Number(r.budget_impact),
    year: Number(r.year),
    month: Number(r.month),
  } as Transaction;
}

function toLoan(r: Record<string, unknown>): Loan {
  return {
    ...r,
    date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
    amount: Number(r.amount),
    year: Number(r.year),
    month: Number(r.month),
  } as Loan;
}

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

    // Cutoff for health score / trend / warnings (13 months ≥ 12-month trend + 6-month health)
    const thirteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1)
      .toISOString()
      .slice(0, 10);

    // Period-specific query — push filtering to SQL, avoiding full table scan in JS
    const periodQuery = hasDateRange
      ? sql`SELECT * FROM transactions WHERE date >= ${dateFromParam} AND date <= ${dateToParam} ORDER BY date DESC`
      : monthParam
        ? sql`SELECT * FROM transactions WHERE year = ${year} AND month = ${month} ORDER BY date DESC`
        : yearParam
          ? sql`SELECT * FROM transactions WHERE year = ${year} ORDER BY date DESC`
          : sql`SELECT * FROM transactions ORDER BY date DESC`;

    // Run all DB queries in parallel
    const [periodTxRows, recentTxRows, loanRows, paymentRows, balanceSumRows, settings] =
      await Promise.all([
        periodQuery,
        // 13-month window for health score, trend, and warnings
        sql`SELECT * FROM transactions WHERE date >= ${thirteenMonthsAgo} ORDER BY date DESC`,
        sql`SELECT * FROM loans`,
        sql`SELECT * FROM payments`,
        // All-time aggregate for current balance — no need to JS-reduce all rows
        sql`
          SELECT
            COALESCE(SUM(CASE WHEN transaction_type = 'income'  THEN amount ELSE 0 END), 0)::bigint AS income,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)::bigint AS expense
          FROM transactions
        `,
        readSettings(),
      ]);

    const periodTransactions = (periodTxRows as Record<string, unknown>[]).map(toTx);
    // For all-time view period already covers everything — reuse to avoid duplicate iteration
    const recentTx = hasFilters
      ? (recentTxRows as Record<string, unknown>[]).map(toTx)
      : periodTransactions;

    const loans = (loanRows as Record<string, unknown>[]).map(toLoan);
    const allPayments = paymentRows as Payment[];

    const paidMap: Record<number, number> = {};
    allPayments.forEach((p) => {
      paidMap[p.loan_id] = (paidMap[p.loan_id] || 0) + Number(p.amount);
    });

    // --- Period Summary ---
    const totalIncome = periodTransactions.filter((t) => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = periodTransactions.filter((t) => t.transaction_type === "expense").reduce((s, t) => s + t.amount, 0);
    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const totalIncomeExcludingBig = periodTransactions.filter((t) => t.transaction_type === "income" && t.special_tag !== "BigY").reduce((s, t) => s + t.amount, 0);
    const totalExpenseExcludingBig = periodTransactions.filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY").reduce((s, t) => s + t.amount, 0);
    const netCashFlowExcludingBig = totalIncomeExcludingBig - totalExpenseExcludingBig;

    const period = hasDateRange
      ? `${dateFromParam} - ${dateToParam}`
      : hasFilters
        ? (monthParam ? `T${month}/${year}` : `${year}`)
        : "Tất cả";

    // --- Current Balance (SQL aggregate — avoids loading all rows just for a SUM) ---
    const { income: allIncome, expense: allExpense } = balanceSumRows[0] as {
      income: bigint | number;
      expense: bigint | number;
    };
    const outstandingBorrowing = loans
      .filter((l) => l.loan_type === "borrowing" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);
    const outstandingLending = loans
      .filter((l) => l.loan_type === "lending" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);
    const currentBalance =
      Number(allIncome) - Number(allExpense) + outstandingBorrowing - outstandingLending;

    const summary: CashFlowSummary = {
      totalIncome, totalExpense, netCashFlow,
      savingsRate: Math.round(savingsRate * 10) / 10,
      totalIncomeExcludingBig, totalExpenseExcludingBig, netCashFlowExcludingBig, period,
    };

    // --- Health Score (last 6 months, subset of recentTx) ---
    const healthScore = calculateHealthScore(recentTx, loans, 6, paidMap);

    // --- Spending By Group / Category (period) ---
    const expenses = periodTransactions.filter((t) => t.transaction_type === "expense");
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

    const groupMap: Record<string, { total: number; categories: Record<string, { total: number; count: number }> }> = {};
    expenses.forEach((t) => {
      if (!groupMap[t.category_group]) groupMap[t.category_group] = { total: 0, categories: {} };
      groupMap[t.category_group].total += t.amount;
      if (!groupMap[t.category_group].categories[t.category]) groupMap[t.category_group].categories[t.category] = { total: 0, count: 0 };
      groupMap[t.category_group].categories[t.category].total += t.amount;
      groupMap[t.category_group].categories[t.category].count += 1;
    });

    const spendingByGroup: GroupSpending[] = Object.entries(groupMap)
      .map(([group, data]) => ({
        group,
        total: data.total,
        percentage: totalExp > 0 ? Math.round((data.total / totalExp) * 1000) / 10 : 0,
        categories: Object.entries(data.categories)
          .map(([cat, catData]) => ({
            category: cat, group,
            total: catData.total,
            percentage: totalExp > 0 ? Math.round((catData.total / totalExp) * 1000) / 10 : 0,
            count: catData.count,
          }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);

    const catMap: Record<string, { total: number; count: number; group: string }> = {};
    expenses.forEach((t) => {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0, group: t.category_group };
      catMap[t.category].total += t.amount;
      catMap[t.category].count += 1;
    });
    const spendingByCategory: CategorySpending[] = Object.entries(catMap)
      .map(([category, data]) => ({
        category, group: data.group, total: data.total,
        percentage: totalExp > 0 ? Math.round((data.total / totalExp) * 1000) / 10 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // --- Monthly Trend (last 12 months — from recentTx) ---
    const trendMonths: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      trendMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const monthlyTrend: MonthlyTrend[] = trendMonths.map((tm) => {
      const monthTx = recentTx.filter((t) => t.year === tm.year && t.month === tm.month);
      const income = monthTx.filter((t) => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter((t) => t.transaction_type === "expense").reduce((s, t) => s + t.amount, 0);
      return { year: tm.year, month: tm.month, label: getMonthLabel(tm.year, tm.month), income, expense, net: income - expense };
    });

    // --- Recent Transactions (top 10, already DESC from SQL) ---
    const recentTransactions = periodTransactions.slice(0, 10);

    // --- Warnings (recentTx covers current week/month + 6-month history) ---
    const resolvedThresholds = resolveThresholds(settings);
    const warnings = generateWarnings(recentTx, year, month, resolvedThresholds);

    // --- Loan Summary ---
    const loanSummary: LoanSummary = {
      totalBorrowing: loans.filter((l) => l.loan_type === "borrowing").reduce((s, l) => s + l.amount, 0),
      totalLending: loans.filter((l) => l.loan_type === "lending").reduce((s, l) => s + l.amount, 0),
      outstandingBorrowing,
      outstandingLending,
      netDebt: outstandingBorrowing - outstandingLending,
      borrowingCount: loans.filter((l) => l.loan_type === "borrowing").length,
      lendingCount: loans.filter((l) => l.loan_type === "lending").length,
    };

    const dashboardData: DashboardData = {
      summary, currentBalance, healthScore, spendingByCategory, spendingByGroup,
      monthlyTrend, recentTransactions, warnings, loanSummary,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error computing dashboard data:", error);
    return NextResponse.json({ error: "Failed to compute dashboard data" }, { status: 500 });
  }
}
