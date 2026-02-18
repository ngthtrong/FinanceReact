import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { TRANSACTION_HEADERS } from "@/lib/csv";
import { Transaction } from "@/types";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const transaction_type = searchParams.get("transaction_type") || "all";
    const category = searchParams.get("category") || "";
    const category_group = searchParams.get("category_group") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(category) LIKE $${idx} OR LOWER(category_group) LIKE $${idx})`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (transaction_type && transaction_type !== "all") {
      conditions.push(`transaction_type = $${idx++}`);
      values.push(transaction_type);
    }
    if (category) { conditions.push(`category = $${idx++}`); values.push(category); }
    if (category_group) { conditions.push(`category_group = $${idx++}`); values.push(category_group); }
    if (date_from) { conditions.push(`date >= $${idx++}`); values.push(date_from); }
    if (date_to) { conditions.push(`date <= $${idx++}`); values.push(date_to); }
    if (year) { conditions.push(`year = $${idx++}`); values.push(parseInt(year, 10)); }
    if (month) { conditions.push(`month = $${idx++}`); values.push(parseInt(month, 10)); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await sql.query(`SELECT * FROM transactions ${where} ORDER BY date DESC`, values);

    let transactions = (rows as Record<string, unknown>[]).map((r) => ({
      ...r,
      date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
      amount: Number(r.amount),
      budget_impact: Number(r.budget_impact),
    })) as Transaction[];

    const csvContent = Papa.unparse(transactions, { columns: TRANSACTION_HEADERS });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return NextResponse.json(
      { error: "Failed to export transactions" },
      { status: 500 }
    );
  }
}
