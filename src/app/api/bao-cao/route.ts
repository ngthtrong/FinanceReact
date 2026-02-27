import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Transaction } from "@/types";
import { generateMonthlyReport } from "@/lib/report-analysis";
import { readSettings } from "@/lib/settings";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

    // Need 7 months of data: current + 6 months history for anomaly detection
    const startDate = new Date(year, month - 7, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    const [txRows, settings] = await Promise.all([
      sql`SELECT * FROM transactions WHERE date >= ${startDate} AND date <= ${endDate} ORDER BY date DESC`,
      readSettings(),
    ]);

    const transactions = (txRows as Record<string, unknown>[]).map(toTx);
    const report = generateMonthlyReport(transactions, year, month, settings);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly report" },
      { status: 500 }
    );
  }
}
