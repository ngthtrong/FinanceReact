import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Transaction, TransactionCreateInput, PaginatedResponse } from "@/types";
import { getDayOfWeek } from "@/lib/formatters";

function toTransaction(r: Record<string, unknown>): Transaction {
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

    const search = searchParams.get("search") || "";
    const transaction_type = searchParams.get("transaction_type") || "all";
    const category = searchParams.get("category") || "";
    const category_group = searchParams.get("category_group") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const sort_by = searchParams.get("sort_by") || "date";
    const sort_order = searchParams.get("sort_order") || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "20", 10);

    const ALLOWED_SORT = ["date", "amount", "category", "title", "category_group", "transaction_type"];
    const safeSort = ALLOWED_SORT.includes(sort_by) ? sort_by : "date";
    const safeOrder = sort_order === "asc" ? "ASC" : "DESC";

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
    if (category) {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }
    if (category_group) {
      conditions.push(`category_group = $${idx++}`);
      values.push(category_group);
    }
    if (date_from) {
      conditions.push(`date >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`date <= $${idx++}`);
      values.push(date_to);
    }
    if (year) {
      conditions.push(`year = $${idx++}`);
      values.push(parseInt(year, 10));
    }
    if (month) {
      conditions.push(`month = $${idx++}`);
      values.push(parseInt(month, 10));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * per_page;

    const [countResult, rows, sumResult] = await Promise.all([
      sql.query(`SELECT COUNT(*)::int AS total FROM transactions ${where}`, values),
      sql.query(`SELECT * FROM transactions ${where} ORDER BY ${safeSort} ${safeOrder} LIMIT $${idx} OFFSET $${idx + 1}`, [...values, per_page, offset]),
      sql.query(`SELECT COALESCE(SUM(amount),0)::bigint AS total_amount, COALESCE(SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END),0)::bigint AS total_income, COALESCE(SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END),0)::bigint AS total_expense FROM transactions ${where}`, values),
    ]);

    const total = (countResult[0] as { total: number }).total;
    const totalPages = Math.ceil(total / per_page);
    const transactions = (rows as Record<string, unknown>[]).map(toTransaction);
    const { total_income, total_expense } = sumResult[0] as { total_income: string; total_expense: string };

    const response: PaginatedResponse<Transaction> = { data: transactions, total, page, perPage: per_page, totalPages, totalAmount: Number(total_income) - Number(total_expense), totalIncome: Number(total_income), totalExpense: Number(total_expense) };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading transactions:", error);
    return NextResponse.json({ error: "Failed to read transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionCreateInput = await request.json();

    if (!body.date || !body.title || body.amount == null || !body.transaction_type || !body.category || !body.category_group) {
      return NextResponse.json(
        { error: "Missing required fields: date, title, amount, transaction_type, category, category_group" },
        { status: 400 }
      );
    }

    const dateObj = new Date(body.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day_of_week = getDayOfWeek(body.date);
    const budget_impact = body.transaction_type === "income" ? body.amount : -body.amount;

    const rows = await sql`
      INSERT INTO transactions (date, title, amount, transaction_type, category, category_group, special_tag, budget_impact, year, month, day_of_week)
      VALUES (${body.date}, ${body.title}, ${body.amount}, ${body.transaction_type}, ${body.category}, ${body.category_group}, ${body.special_tag || ""}, ${budget_impact}, ${year}, ${month}, ${day_of_week})
      RETURNING *
    `;

    return NextResponse.json(toTransaction(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
